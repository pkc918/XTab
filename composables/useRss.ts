import {
  computed,
  onMounted,
  onUnmounted,
  readonly,
  ref,
  shallowRef,
} from 'vue';

export type RssFeedFormat = 'rss' | 'rdf' | 'atom' | 'json-feed';
export type RssLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface RssFeedSource {
  url: string;
  title?: string;
  category?: string;
  enabled?: boolean;
}

export type RssFeedSourceInput = string | RssFeedSource;

export interface RssFeedAuthor {
  name: string;
  url?: string;
  avatarUrl?: string;
}

export interface RssFeedAttachment {
  url: string;
  mimeType?: string;
  title?: string;
  sizeInBytes?: number;
  durationInSeconds?: number;
}

export interface RssFeedItem {
  id: string;
  title: string;
  url?: string;
  externalUrl?: string;
  summary: string;
  content: string;
  publishedAt?: string;
  updatedAt?: string;
  authors: RssFeedAuthor[];
  tags: string[];
  imageUrl?: string;
  attachments: RssFeedAttachment[];
}

export interface ParsedRssFeed {
  format: RssFeedFormat;
  title: string;
  description: string;
  homePageUrl?: string;
  feedUrl?: string;
  language?: string;
  imageUrl?: string;
  updatedAt?: string;
  authors: RssFeedAuthor[];
  items: RssFeedItem[];
  warnings: string[];
}

export interface RssStreamItem extends RssFeedItem {
  feedTitle: string;
  feedUrl?: string;
  sourceUrl: string;
  sourceCategory?: string;
}

export interface LoadedRssFeed {
  source: RssFeedSource;
  feed: ParsedRssFeed;
  fetchedAt: string;
  stale: boolean;
}

export interface RssLoadError {
  source: RssFeedSource;
  message: string;
  cause?: unknown;
}

export interface ParseRssFeedOptions {
  sourceUrl?: string;
  contentType?: string;
}

export interface UseRssOptions {
  immediate?: boolean;
  timeoutMs?: number;
  maxFeedBytes?: number;
  maxItemsPerFeed?: number;
  fetcher?: typeof fetch;
}

export interface RefreshRssOptions {
  force?: boolean;
  requestPermissions?: boolean;
}

export interface RssRefreshResult {
  feeds: LoadedRssFeed[];
  errors: RssLoadError[];
}

export type RssParseErrorCode =
  | 'EMPTY_FEED'
  | 'INVALID_JSON'
  | 'INVALID_XML'
  | 'INVALID_FEED'
  | 'UNSUPPORTED_FORMAT';

interface CachedFeed {
  etag?: string;
  lastModified?: string;
  loaded: LoadedRssFeed;
}

interface JsonRecord {
  [key: string]: unknown;
}

const defaultTimeoutMs = 15_000;
const defaultMaxFeedBytes = 5 * 1024 * 1024;
const defaultMaxItemsPerFeed = 100;
const xmlBaseNamespace = 'http://www.w3.org/XML/1998/namespace';
const feedAcceptHeader = [
  'application/feed+json',
  'application/atom+xml',
  'application/rss+xml',
  'application/rdf+xml',
  'application/xml;q=0.9',
  'text/xml;q=0.9',
  'application/json;q=0.8',
  'text/plain;q=0.5',
  '*/*;q=0.1',
].join(', ');

export class RssParseError extends Error {
  readonly code: RssParseErrorCode;

  constructor(code: RssParseErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'RssParseError';
    this.code = code;
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(record: JsonRecord, key: string) {
  const value = record[key];
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

function numberValue(record: JsonRecord, key: string) {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function markupToText(value: string | null | undefined) {
  const source = value?.trim() ?? '';
  if (!source) return '';
  if (!/[<&][a-z#!/?]/i.test(source)) return normalizeText(source);

  const document = new DOMParser().parseFromString(
    `<!doctype html><html><body>${source}</body></html>`,
    'text/html',
  );
  document.querySelectorAll('script, style, noscript, template, svg, math')
    .forEach((element) => element.remove());
  return normalizeText(document.body.textContent);
}

function titleFromContent(value: string) {
  const normalized = normalizeText(value);
  if (!normalized) return '无标题';
  return normalized.length > 120 ? `${normalized.slice(0, 117)}…` : normalized;
}

function normalizeDate(value: string | null | undefined) {
  const source = value?.trim();
  if (!source) return undefined;
  const milliseconds = Date.parse(source);
  if (!Number.isFinite(milliseconds)) return undefined;
  return new Date(milliseconds).toISOString();
}

function resolveWebUrl(value: string | null | undefined, baseUrl?: string) {
  const source = value?.trim();
  if (!source) return undefined;

  try {
    const url = baseUrl ? new URL(source, baseUrl) : new URL(source);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

function normalizedLocalName(node: { localName: string; tagName?: string }) {
  const name = node.localName || node.tagName || '';
  const parts = name.split(':');
  return (parts[parts.length - 1] ?? '').toLowerCase();
}

function elementPrefix(element: Element) {
  return element.prefix?.toLowerCase()
    || (element.tagName.includes(':') ? element.tagName.split(':')[0].toLowerCase() : undefined);
}

function directChildren(element: Element, localName: string) {
  const expected = localName.toLowerCase();
  return Array.from(element.children).filter(
    (child) => normalizedLocalName(child) === expected,
  );
}

function firstDirectChild(element: Element, ...localNames: string[]) {
  const names = new Set(localNames.map((name) => name.toLowerCase()));
  return Array.from(element.children).find(
    (child) => names.has(normalizedLocalName(child)),
  );
}

function descendants(element: Element, localName: string) {
  const expected = localName.toLowerCase();
  return Array.from(element.getElementsByTagName('*')).filter(
    (child) => normalizedLocalName(child) === expected,
  );
}

function elementText(element: Element | undefined) {
  return element?.textContent?.trim() ?? '';
}

function elementBaseUrl(element: Element, fallback?: string) {
  const ancestors: Element[] = [];
  let current: Element | null = element;
  while (current) {
    ancestors.unshift(current);
    current = current.parentElement;
  }

  let baseUrl = fallback;
  for (const ancestor of ancestors) {
    const declaredBase = ancestor.getAttributeNS(xmlBaseNamespace, 'base')
      || ancestor.getAttribute('xml:base');
    if (!declaredBase) continue;
    try {
      baseUrl = baseUrl ? new URL(declaredBase, baseUrl).href : new URL(declaredBase).href;
    } catch {
      // Invalid xml:base values are ignored, as recommended for permissive readers.
    }
  }
  return baseUrl;
}

function elementUrl(value: string | null | undefined, element: Element, fallback?: string) {
  return resolveWebUrl(value, elementBaseUrl(element, fallback));
}

function firstMarkupImage(markup: string, baseUrl?: string) {
  if (!/<(?:img|source)\b/i.test(markup)) return undefined;
  const document = new DOMParser().parseFromString(
    `<!doctype html><html><body>${markup}</body></html>`,
    'text/html',
  );
  const image = document.querySelector('img[src], source[src]');
  return resolveWebUrl(image?.getAttribute('src'), baseUrl);
}

function deterministicId(parts: Array<string | undefined>) {
  const input = parts.filter(Boolean).join('\u001f');
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `generated-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function dedupeStrings(values: Array<string | undefined>) {
  return [...new Set(values.map((value) => normalizeText(value)).filter(Boolean))];
}

function dedupeAuthors(authors: RssFeedAuthor[]) {
  const seen = new Set<string>();
  return authors.filter((author) => {
    const key = `${author.name}\u001f${author.url ?? ''}`;
    if (!author.name || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeAttachments(attachments: RssFeedAttachment[]) {
  const seen = new Set<string>();
  return attachments.filter((attachment) => {
    if (seen.has(attachment.url)) return false;
    seen.add(attachment.url);
    return true;
  });
}

function parseXmlAuthor(element: Element, sourceUrl?: string): RssFeedAuthor | undefined {
  const name = normalizeText(elementText(firstDirectChild(element, 'name')) || elementText(element));
  if (!name) return undefined;
  const uriElement = firstDirectChild(element, 'uri', 'url');
  const avatarElement = firstDirectChild(element, 'avatar');
  return {
    name,
    url: uriElement ? elementUrl(elementText(uriElement), uriElement, sourceUrl) : undefined,
    avatarUrl: avatarElement
      ? elementUrl(elementText(avatarElement), avatarElement, sourceUrl)
      : undefined,
  };
}

function atomText(element: Element | undefined) {
  if (!element) return '';
  const type = (element.getAttribute('type') || 'text').toLowerCase();
  const value = elementText(element);
  if (type === 'html') return markupToText(value);
  return normalizeText(value);
}

function atomLinks(element: Element, sourceUrl?: string) {
  return directChildren(element, 'link').map((link) => ({
    rel: (link.getAttribute('rel') || 'alternate').toLowerCase(),
    type: (link.getAttribute('type') || '').toLowerCase(),
    title: normalizeText(link.getAttribute('title')),
    href: elementUrl(link.getAttribute('href') || elementText(link), link, sourceUrl),
    element: link,
  })).filter((link) => Boolean(link.href));
}

function preferredAlternateLink(element: Element, sourceUrl?: string) {
  const links = atomLinks(element, sourceUrl).filter((link) => link.rel === 'alternate');
  return links.find((link) => !link.type || link.type.includes('html'))?.href ?? links[0]?.href;
}

function mediaElements(element: Element, localName: string) {
  return descendants(element, localName).filter((candidate) => {
    const prefix = elementPrefix(candidate);
    const namespace = candidate.namespaceURI?.toLowerCase() ?? '';
    return prefix === 'media' || namespace.includes('search.yahoo.com/mrss');
  });
}

function xmlAttachments(item: Element, sourceUrl?: string) {
  const attachments: RssFeedAttachment[] = [];

  for (const enclosure of directChildren(item, 'enclosure')) {
    const url = elementUrl(enclosure.getAttribute('url'), enclosure, sourceUrl);
    if (!url) continue;
    const length = Number(enclosure.getAttribute('length'));
    attachments.push({
      url,
      mimeType: normalizeText(enclosure.getAttribute('type')) || undefined,
      title: normalizeText(enclosure.getAttribute('title')) || undefined,
      sizeInBytes: Number.isFinite(length) && length >= 0 ? length : undefined,
    });
  }

  for (const content of mediaElements(item, 'content')) {
    const url = elementUrl(content.getAttribute('url'), content, sourceUrl);
    if (!url) continue;
    const size = Number(content.getAttribute('fileSize'));
    const duration = Number(content.getAttribute('duration'));
    attachments.push({
      url,
      mimeType: normalizeText(content.getAttribute('type')) || undefined,
      sizeInBytes: Number.isFinite(size) && size >= 0 ? size : undefined,
      durationInSeconds: Number.isFinite(duration) && duration >= 0 ? duration : undefined,
    });
  }

  return dedupeAttachments(attachments);
}

function xmlItemImage(
  item: Element,
  attachments: RssFeedAttachment[],
  markup: string,
  sourceUrl?: string,
) {
  const thumbnail = mediaElements(item, 'thumbnail')[0];
  const thumbnailUrl = thumbnail
    ? elementUrl(thumbnail.getAttribute('url'), thumbnail, sourceUrl)
    : undefined;
  if (thumbnailUrl) return thumbnailUrl;

  const image = directChildren(item, 'image').find((candidate) => (
    elementPrefix(candidate) === 'itunes'
    || (candidate.namespaceURI?.toLowerCase() ?? '').includes('itunes')
  ));
  const imageUrl = image
    ? elementUrl(image.getAttribute('href') || elementText(image), image, sourceUrl)
    : undefined;
  if (imageUrl) return imageUrl;

  const imageAttachment = attachments.find((attachment) => attachment.mimeType?.startsWith('image/'));
  if (imageAttachment) return imageAttachment.url;

  const mediaImage = mediaElements(item, 'content').find((candidate) => (
    candidate.getAttribute('medium')?.toLowerCase() === 'image'
    || candidate.getAttribute('type')?.toLowerCase().startsWith('image/')
  ));
  const mediaImageUrl = mediaImage
    ? elementUrl(mediaImage.getAttribute('url'), mediaImage, sourceUrl)
    : undefined;
  if (mediaImageUrl) return mediaImageUrl;

  const directImage = descendants(item, 'img')[0];
  const directImageUrl = directImage
    ? elementUrl(directImage.getAttribute('src'), directImage, sourceUrl)
    : undefined;
  return directImageUrl || firstMarkupImage(markup, elementBaseUrl(item, sourceUrl));
}

function rssAuthors(item: Element) {
  const authors = [
    ...directChildren(item, 'creator'),
    ...directChildren(item, 'author'),
  ].map((author) => normalizeText(elementText(author)))
    .filter(Boolean)
    .map((name) => ({ name }));
  return dedupeAuthors(authors);
}

function parseRssItem(item: Element, sourceUrl?: string): RssFeedItem {
  const titleElement = firstDirectChild(item, 'title');
  const descriptionElement = firstDirectChild(item, 'description', 'summary');
  const encodedElement = firstDirectChild(item, 'encoded');
  const contentElement = encodedElement || descriptionElement;
  const rawDescription = elementText(descriptionElement);
  const rawContent = elementText(contentElement);
  const content = markupToText(rawContent);
  const summary = markupToText(rawDescription) || content;

  const linkElement = directChildren(item, 'link').find((candidate) => !candidate.hasAttribute('href'))
    || firstDirectChild(item, 'link');
  const link = linkElement
    ? elementUrl(linkElement.getAttribute('href') || elementText(linkElement), linkElement, sourceUrl)
    : undefined;
  const guidElement = firstDirectChild(item, 'guid', 'id');
  const guid = normalizeText(elementText(guidElement));
  const guidIsPermalink = guidElement?.getAttribute('isPermaLink')?.toLowerCase() !== 'false';
  const guidUrl = guidIsPermalink && guidElement
    ? elementUrl(guid, guidElement, sourceUrl)
    : undefined;
  const url = link || guidUrl;

  const title = markupToText(elementText(titleElement)) || titleFromContent(summary || content);
  const publishedElement = firstDirectChild(item, 'pubDate', 'published', 'issued', 'date');
  const updatedElement = firstDirectChild(item, 'updated', 'modified');
  const tags = dedupeStrings(directChildren(item, 'category').map((category) => (
    category.getAttribute('term') || elementText(category)
  )));
  const attachments = xmlAttachments(item, sourceUrl);

  return {
    id: guid || url || deterministicId([
      sourceUrl,
      title,
      elementText(publishedElement),
      summary.slice(0, 160),
    ]),
    title,
    url,
    summary,
    content,
    publishedAt: normalizeDate(elementText(publishedElement)),
    updatedAt: normalizeDate(elementText(updatedElement)),
    authors: rssAuthors(item),
    tags,
    imageUrl: xmlItemImage(item, attachments, rawContent || rawDescription, sourceUrl),
    attachments,
  };
}

function rssFeedImage(channel: Element, sourceUrl?: string) {
  const image = directChildren(channel, 'image').find((candidate) => !elementPrefix(candidate));
  const imageUrlElement = image ? firstDirectChild(image, 'url') : undefined;
  if (imageUrlElement) return elementUrl(elementText(imageUrlElement), imageUrlElement, sourceUrl);

  const logo = firstDirectChild(channel, 'logo', 'icon');
  return logo ? elementUrl(elementText(logo), logo, sourceUrl) : undefined;
}

function parseRssXml(root: Element, sourceUrl?: string): ParsedRssFeed {
  const channel = normalizedLocalName(root) === 'channel'
    ? root
    : firstDirectChild(root, 'channel');
  if (!channel) {
    throw new RssParseError('INVALID_FEED', 'RSS 文档缺少 channel 节点。');
  }

  const title = markupToText(elementText(firstDirectChild(channel, 'title'))) || '未命名订阅';
  const description = markupToText(elementText(firstDirectChild(channel, 'description', 'subtitle')));
  const htmlLinkElement = directChildren(channel, 'link').find((link) => !link.hasAttribute('href'));
  const homePageUrl = htmlLinkElement
    ? elementUrl(elementText(htmlLinkElement), htmlLinkElement, sourceUrl)
    : preferredAlternateLink(channel, sourceUrl);
  const selfLink = atomLinks(channel, sourceUrl).find((link) => link.rel === 'self')?.href;
  const authorElements = [
    ...directChildren(channel, 'author'),
    ...directChildren(channel, 'creator'),
    ...directChildren(channel, 'managingEditor'),
  ];
  const authors = dedupeAuthors(authorElements.map((author) => parseXmlAuthor(author, sourceUrl))
    .filter((author): author is RssFeedAuthor => Boolean(author)));
  const updatedElement = firstDirectChild(channel, 'lastBuildDate', 'pubDate', 'updated', 'date');

  return {
    format: 'rss',
    title,
    description,
    homePageUrl,
    feedUrl: selfLink || sourceUrl,
    language: normalizeText(elementText(firstDirectChild(channel, 'language'))) || undefined,
    imageUrl: rssFeedImage(channel, sourceUrl),
    updatedAt: normalizeDate(elementText(updatedElement)),
    authors,
    items: directChildren(channel, 'item').map((item) => parseRssItem(item, sourceUrl)),
    warnings: [],
  };
}

function attributeByLocalName(element: Element, localName: string) {
  return Array.from(element.attributes).find(
    (attribute) => normalizedLocalName(attribute) === localName.toLowerCase(),
  )?.value;
}

function parseRdfXml(root: Element, sourceUrl?: string): ParsedRssFeed {
  const channel = firstDirectChild(root, 'channel');
  if (!channel) {
    throw new RssParseError('INVALID_FEED', 'RSS 1.0 文档缺少 channel 节点。');
  }

  const items = directChildren(root, 'item').map((item) => {
    const parsed = parseRssItem(item, sourceUrl);
    const about = normalizeText(attributeByLocalName(item, 'about'));
    return about ? { ...parsed, id: about, url: parsed.url || resolveWebUrl(about, sourceUrl) } : parsed;
  });
  const homeLink = firstDirectChild(channel, 'link');
  const image = firstDirectChild(root, 'image');
  const imageUrl = image
    ? resolveWebUrl(attributeByLocalName(image, 'about'), sourceUrl)
      || elementUrl(elementText(firstDirectChild(image, 'url')), image, sourceUrl)
    : undefined;

  return {
    format: 'rdf',
    title: markupToText(elementText(firstDirectChild(channel, 'title'))) || '未命名订阅',
    description: markupToText(elementText(firstDirectChild(channel, 'description'))),
    homePageUrl: homeLink ? elementUrl(elementText(homeLink), homeLink, sourceUrl) : undefined,
    feedUrl: resolveWebUrl(attributeByLocalName(channel, 'about'), sourceUrl) || sourceUrl,
    language: normalizeText(elementText(firstDirectChild(channel, 'language'))) || undefined,
    imageUrl,
    updatedAt: normalizeDate(elementText(firstDirectChild(channel, 'date'))),
    authors: [],
    items,
    warnings: [],
  };
}

function atomAuthors(element: Element, sourceUrl?: string) {
  return dedupeAuthors(directChildren(element, 'author')
    .map((author) => parseXmlAuthor(author, sourceUrl))
    .filter((author): author is RssFeedAuthor => Boolean(author)));
}

function parseAtomItem(
  entry: Element,
  sourceUrl: string | undefined,
  feedAuthors: RssFeedAuthor[],
): RssFeedItem {
  const titleElement = firstDirectChild(entry, 'title');
  const summaryElement = firstDirectChild(entry, 'summary');
  const contentElement = firstDirectChild(entry, 'content');
  const summary = atomText(summaryElement);
  const content = atomText(contentElement) || summary;
  const url = preferredAlternateLink(entry, sourceUrl);
  const id = normalizeText(elementText(firstDirectChild(entry, 'id')));
  const links = atomLinks(entry, sourceUrl);
  const attachments = dedupeAttachments([
    ...links.filter((link) => link.rel === 'enclosure' && link.href)
      .map((link) => ({
        url: link.href!,
        mimeType: link.type || undefined,
        title: link.title || undefined,
        sizeInBytes: (() => {
          const length = Number(link.element.getAttribute('length'));
          return Number.isFinite(length) && length >= 0 ? length : undefined;
        })(),
      })),
    ...xmlAttachments(entry, sourceUrl),
  ]);
  const mediaThumbnail = mediaElements(entry, 'thumbnail')[0];
  const imageAttachment = attachments.find((attachment) => attachment.mimeType?.startsWith('image/'));
  const contentMarkup = elementText(contentElement);
  const authors = atomAuthors(entry, sourceUrl);
  const publishedElement = firstDirectChild(entry, 'published', 'issued', 'created');
  const updatedElement = firstDirectChild(entry, 'updated', 'modified');

  return {
    id: id || url || deterministicId([
      sourceUrl,
      atomText(titleElement),
      elementText(publishedElement),
      summary.slice(0, 160),
    ]),
    title: atomText(titleElement) || titleFromContent(summary || content),
    url,
    summary: summary || content,
    content,
    publishedAt: normalizeDate(elementText(publishedElement)),
    updatedAt: normalizeDate(elementText(updatedElement)),
    authors: authors.length > 0 ? authors : feedAuthors,
    tags: dedupeStrings(directChildren(entry, 'category').map((category) => (
      category.getAttribute('label') || category.getAttribute('term') || elementText(category)
    ))),
    imageUrl: mediaThumbnail
      ? elementUrl(mediaThumbnail.getAttribute('url'), mediaThumbnail, sourceUrl)
      : imageAttachment?.url || firstMarkupImage(contentMarkup, elementBaseUrl(entry, sourceUrl)),
    attachments,
  };
}

function parseAtomXml(root: Element, sourceUrl?: string): ParsedRssFeed {
  const authors = atomAuthors(root, sourceUrl);
  const links = atomLinks(root, sourceUrl);
  const homePageUrl = links.find((link) => (
    link.rel === 'alternate' && (!link.type || link.type.includes('html'))
  ))?.href ?? links.find((link) => link.rel === 'alternate')?.href;
  const selfLink = links.find((link) => link.rel === 'self')?.href;
  const icon = firstDirectChild(root, 'icon', 'logo');

  return {
    format: 'atom',
    title: atomText(firstDirectChild(root, 'title')) || '未命名订阅',
    description: atomText(firstDirectChild(root, 'subtitle')),
    homePageUrl,
    feedUrl: selfLink || sourceUrl,
    language: normalizeText(root.getAttributeNS(xmlBaseNamespace, 'lang') || root.getAttribute('xml:lang'))
      || undefined,
    imageUrl: icon ? elementUrl(elementText(icon), icon, sourceUrl) : undefined,
    updatedAt: normalizeDate(elementText(firstDirectChild(root, 'updated'))),
    authors,
    items: directChildren(root, 'entry').map((entry) => parseAtomItem(entry, sourceUrl, authors)),
    warnings: [],
  };
}

function parseJsonAuthor(value: unknown, sourceUrl?: string): RssFeedAuthor | undefined {
  if (!isRecord(value)) return undefined;
  const name = stringValue(value, 'name');
  if (!name) return undefined;
  return {
    name,
    url: resolveWebUrl(stringValue(value, 'url'), sourceUrl),
    avatarUrl: resolveWebUrl(stringValue(value, 'avatar'), sourceUrl),
  };
}

function jsonAuthors(record: JsonRecord, sourceUrl?: string) {
  const values = Array.isArray(record.authors)
    ? record.authors
    : record.author
      ? [record.author]
      : [];
  return dedupeAuthors(values.map((author) => parseJsonAuthor(author, sourceUrl))
    .filter((author): author is RssFeedAuthor => Boolean(author)));
}

function parseJsonAttachment(value: unknown, sourceUrl?: string): RssFeedAttachment | undefined {
  if (!isRecord(value)) return undefined;
  const url = resolveWebUrl(stringValue(value, 'url'), sourceUrl);
  if (!url) return undefined;
  return {
    url,
    mimeType: stringValue(value, 'mime_type') || undefined,
    title: stringValue(value, 'title') || undefined,
    sizeInBytes: numberValue(value, 'size_in_bytes'),
    durationInSeconds: numberValue(value, 'duration_in_seconds'),
  };
}

function parseJsonFeed(content: string, sourceUrl?: string): ParsedRssFeed {
  let value: unknown;
  try {
    value = JSON.parse(content);
  } catch (cause) {
    throw new RssParseError('INVALID_JSON', 'JSON Feed 不是有效的 JSON。', { cause });
  }

  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new RssParseError('INVALID_FEED', 'JSON Feed 缺少必需的 items 数组。');
  }

  const version = stringValue(value, 'version');
  if (version && !version.includes('jsonfeed.org/version/')) {
    throw new RssParseError('UNSUPPORTED_FORMAT', 'JSON 内容不是受支持的 JSON Feed。');
  }

  const warnings: string[] = [];
  const feedAuthors = jsonAuthors(value, sourceUrl);
  const items = value.items.flatMap((itemValue, index): RssFeedItem[] => {
    if (!isRecord(itemValue)) {
      warnings.push(`第 ${index + 1} 个 JSON Feed item 不是对象，已忽略。`);
      return [];
    }

    const contentHtml = stringValue(itemValue, 'content_html');
    const contentText = stringValue(itemValue, 'content_text');
    const content = contentText || markupToText(contentHtml);
    const summary = stringValue(itemValue, 'summary') || content;
    const url = resolveWebUrl(stringValue(itemValue, 'url'), sourceUrl);
    const externalUrl = resolveWebUrl(stringValue(itemValue, 'external_url'), sourceUrl);
    const declaredId = stringValue(itemValue, 'id');
    const title = stringValue(itemValue, 'title') || titleFromContent(summary || content);
    const attachments = dedupeAttachments((Array.isArray(itemValue.attachments)
      ? itemValue.attachments
      : []).map((attachment) => parseJsonAttachment(attachment, sourceUrl))
      .filter((attachment): attachment is RssFeedAttachment => Boolean(attachment)));
    if (!declaredId) warnings.push(`JSON Feed item “${title}” 缺少 id，已生成稳定标识。`);

    return [{
      id: declaredId || url || deterministicId([
        sourceUrl,
        title,
        stringValue(itemValue, 'date_published'),
        summary.slice(0, 160),
      ]),
      title,
      url,
      externalUrl,
      summary,
      content,
      publishedAt: normalizeDate(stringValue(itemValue, 'date_published')),
      updatedAt: normalizeDate(stringValue(itemValue, 'date_modified')),
      authors: (() => {
        const authors = jsonAuthors(itemValue, sourceUrl);
        return authors.length > 0 ? authors : feedAuthors;
      })(),
      tags: dedupeStrings(Array.isArray(itemValue.tags)
        ? itemValue.tags.filter((tag): tag is string => typeof tag === 'string')
        : []),
      imageUrl: resolveWebUrl(
        stringValue(itemValue, 'image') || stringValue(itemValue, 'banner_image'),
        sourceUrl,
      ),
      attachments,
    }];
  });

  return {
    format: 'json-feed',
    title: stringValue(value, 'title') || '未命名订阅',
    description: stringValue(value, 'description'),
    homePageUrl: resolveWebUrl(stringValue(value, 'home_page_url'), sourceUrl),
    feedUrl: resolveWebUrl(stringValue(value, 'feed_url'), sourceUrl) || sourceUrl,
    language: stringValue(value, 'language') || undefined,
    imageUrl: resolveWebUrl(
      stringValue(value, 'icon') || stringValue(value, 'favicon'),
      sourceUrl,
    ),
    authors: feedAuthors,
    items,
    warnings,
  };
}

function xmlParserError(document: Document) {
  return Array.from(document.getElementsByTagName('*')).find(
    (element) => normalizedLocalName(element) === 'parsererror',
  );
}

/**
 * Parse RSS 0.9x/2.0, RSS 1.0 (RDF), Atom, or JSON Feed content into one model.
 * HTML from remote feeds is converted to plain text and is never injected into the page.
 */
export function parseRssFeed(content: string, options: ParseRssFeedOptions = {}): ParsedRssFeed {
  const source = content.replace(/^\uFEFF/, '').trim();
  if (!source) throw new RssParseError('EMPTY_FEED', '订阅内容为空。');

  const contentType = options.contentType?.toLowerCase() ?? '';
  const looksLikeJson = contentType.includes('json') || source.startsWith('{');
  if (looksLikeJson) return parseJsonFeed(source, options.sourceUrl);

  if (typeof DOMParser === 'undefined') {
    throw new RssParseError('INVALID_XML', '当前运行环境不支持 DOMParser，无法解析 XML Feed。');
  }

  const document = new DOMParser().parseFromString(source, 'application/xml');
  const parserError = xmlParserError(document);
  if (parserError) {
    throw new RssParseError(
      'INVALID_XML',
      `RSS/Atom XML 格式无效：${normalizeText(parserError.textContent).slice(0, 180)}`,
    );
  }

  const root = document.documentElement;
  const rootName = normalizedLocalName(root);
  if (rootName === 'rss' || rootName === 'channel') {
    return parseRssXml(root, options.sourceUrl);
  }
  if (rootName === 'rdf') return parseRdfXml(root, options.sourceUrl);
  if (rootName === 'feed') return parseAtomXml(root, options.sourceUrl);

  throw new RssParseError(
    'UNSUPPORTED_FORMAT',
    `不支持的订阅格式：${root.tagName || '未知根节点'}。`,
  );
}

function normalizeSource(input: RssFeedSourceInput): RssFeedSource | undefined {
  const source = typeof input === 'string' ? { url: input } : input;
  const url = resolveWebUrl(source.url);
  if (!url) return undefined;
  return {
    url,
    title: normalizeText(source.title) || undefined,
    category: normalizeText(source.category) || undefined,
    enabled: source.enabled !== false,
  };
}

function normalizeSources(inputs: readonly RssFeedSourceInput[]) {
  const seen = new Set<string>();
  return inputs.flatMap((input): RssFeedSource[] => {
    const source = normalizeSource(input);
    if (!source || seen.has(source.url)) return [];
    seen.add(source.url);
    return [source];
  });
}

function permissionOrigin(url: string) {
  const parsed = new URL(url);
  return `${parsed.origin}/*`;
}

async function sourceHasPermission(source: RssFeedSource) {
  if (typeof browser === 'undefined' || !browser.permissions?.contains) return true;
  return browser.permissions.contains({ origins: [permissionOrigin(source.url)] });
}

async function requestSourcePermissions(sources: RssFeedSource[]) {
  if (typeof browser === 'undefined' || !browser.permissions?.request) return true;
  const origins = [...new Set(sources.map((source) => permissionOrigin(source.url)))];
  if (origins.length === 0) return true;
  return browser.permissions.request({ origins });
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return '读取订阅时发生未知错误。';
}

function dateMilliseconds(value?: string) {
  if (!value) return 0;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) ? milliseconds : 0;
}

/**
 * Fetches multiple feeds concurrently, keeps conditional-request metadata in memory,
 * and exposes a date-sorted, de-duplicated content stream.
 */
export function useRss(
  initialSources: readonly RssFeedSourceInput[] = [],
  options: UseRssOptions = {},
) {
  const sources = ref<RssFeedSource[]>(normalizeSources(initialSources));
  const feeds = shallowRef<LoadedRssFeed[]>([]);
  const errors = shallowRef<RssLoadError[]>([]);
  const status = ref<RssLoadStatus>('idle');
  const lastUpdatedAt = ref<string | null>(null);
  const cache = new Map<string, CachedFeed>();
  const timeoutMs = Math.max(options.timeoutMs ?? defaultTimeoutMs, 1_000);
  const maxFeedBytes = Math.max(options.maxFeedBytes ?? defaultMaxFeedBytes, 1_024);
  const maxItemsPerFeed = Math.max(options.maxItemsPerFeed ?? defaultMaxItemsPerFeed, 1);
  const fetcher = options.fetcher ?? fetch;
  let activeController: AbortController | null = null;
  let refreshId = 0;

  const items = computed<RssStreamItem[]>(() => {
    const seen = new Set<string>();
    const stream = feeds.value.flatMap(({ source, feed }) => feed.items.map((item) => ({
      ...item,
      feedTitle: source.title || feed.title,
      feedUrl: feed.feedUrl,
      sourceUrl: source.url,
      sourceCategory: source.category,
    })));

    return stream.filter((item) => {
      const key = item.url || `${item.sourceUrl}\u001f${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((left, right) => (
      dateMilliseconds(right.publishedAt || right.updatedAt)
      - dateMilliseconds(left.publishedAt || left.updatedAt)
    ));
  });

  async function fetchSource(
    source: RssFeedSource,
    parentSignal: AbortSignal,
    force: boolean,
  ): Promise<LoadedRssFeed> {
    const controller = new AbortController();
    let timedOut = false;
    const abortFromParent = () => controller.abort(parentSignal.reason);
    parentSignal.addEventListener('abort', abortFromParent, { once: true });
    const timer = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    try {
      const cached = cache.get(source.url);
      const headers = new Headers({ Accept: feedAcceptHeader });
      if (!force && cached?.etag) headers.set('If-None-Match', cached.etag);
      if (!force && cached?.lastModified) headers.set('If-Modified-Since', cached.lastModified);

      const response = await fetcher(source.url, {
        headers,
        redirect: 'follow',
        signal: controller.signal,
      });
      if (response.status === 304 && cached) {
        const loaded = {
          ...cached.loaded,
          source,
          fetchedAt: new Date().toISOString(),
          stale: false,
        };
        cache.set(source.url, { ...cached, loaded });
        return loaded;
      }
      if (!response.ok) {
        throw new Error(`订阅请求失败（HTTP ${response.status}）。`);
      }

      const declaredLength = Number(response.headers.get('Content-Length'));
      if (Number.isFinite(declaredLength) && declaredLength > maxFeedBytes) {
        throw new Error(`订阅内容超过 ${(maxFeedBytes / 1024 / 1024).toFixed(1)} MB 限制。`);
      }

      const content = await response.text();
      if (new Blob([content]).size > maxFeedBytes) {
        throw new Error(`订阅内容超过 ${(maxFeedBytes / 1024 / 1024).toFixed(1)} MB 限制。`);
      }
      const feed = parseRssFeed(content, {
        sourceUrl: response.url || source.url,
        contentType: response.headers.get('Content-Type') || undefined,
      });
      feed.items = feed.items.slice(0, maxItemsPerFeed);

      const loaded: LoadedRssFeed = {
        source,
        feed,
        fetchedAt: new Date().toISOString(),
        stale: false,
      };
      cache.set(source.url, {
        etag: response.headers.get('ETag') || undefined,
        lastModified: response.headers.get('Last-Modified') || undefined,
        loaded,
      });
      return loaded;
    } catch (error) {
      if (timedOut) throw new Error(`订阅请求在 ${Math.round(timeoutMs / 1_000)} 秒后超时。`);
      throw error;
    } finally {
      window.clearTimeout(timer);
      parentSignal.removeEventListener('abort', abortFromParent);
    }
  }

  async function refresh(refreshOptions: RefreshRssOptions = {}): Promise<RssRefreshResult> {
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;
    const currentRefreshId = ++refreshId;
    const activeSources = sources.value.filter((source) => source.enabled !== false);

    if (activeSources.length === 0) {
      feeds.value = [];
      errors.value = [];
      status.value = 'idle';
      activeController = null;
      return { feeds: [], errors: [] };
    }

    status.value = 'loading';
    errors.value = [];
    const nextErrors: RssLoadError[] = [];

    if (refreshOptions.requestPermissions) {
      try {
        await requestSourcePermissions(activeSources);
      } catch (cause) {
        if (!isAbortError(cause)) {
          nextErrors.push({
            source: activeSources[0],
            message: '无法请求 RSS 来源访问权限。',
            cause,
          });
        }
      }
    }

    const permissions = await Promise.all(activeSources.map(async (source) => {
      try {
        return { source, allowed: await sourceHasPermission(source), checkFailed: false };
      } catch (cause) {
        nextErrors.push({ source, message: '无法检查 RSS 来源访问权限。', cause });
        return { source, allowed: false, checkFailed: true };
      }
    }));
    const permittedSources = permissions.filter(({ allowed }) => allowed).map(({ source }) => source);
    for (const { source, allowed, checkFailed } of permissions) {
      if (!allowed && !checkFailed) {
        nextErrors.push({
          source,
          message: '尚未授予此 RSS 来源的访问权限，请点击刷新后允许访问。',
        });
      }
    }

    const results = await Promise.allSettled(permittedSources.map((source) => (
      fetchSource(source, controller.signal, refreshOptions.force === true)
    )));
    if (controller.signal.aborted || currentRefreshId !== refreshId) {
      return { feeds: feeds.value, errors: errors.value };
    }

    const successfulFeeds: LoadedRssFeed[] = [];
    results.forEach((result, index) => {
      const source = permittedSources[index];
      if (result.status === 'fulfilled') {
        successfulFeeds.push(result.value);
      } else if (!isAbortError(result.reason)) {
        nextErrors.push({ source, message: errorMessage(result.reason), cause: result.reason });
      }
    });

    const successfulUrls = new Set(successfulFeeds.map(({ source }) => source.url));
    const staleFeeds = feeds.value.filter(({ source }) => (
      activeSources.some((candidate) => candidate.url === source.url)
      && !successfulUrls.has(source.url)
    )).map((loaded) => ({ ...loaded, stale: true }));
    feeds.value = [...successfulFeeds, ...staleFeeds];
    errors.value = nextErrors;
    if (successfulFeeds.length > 0) lastUpdatedAt.value = new Date().toISOString();
    status.value = feeds.value.length > 0 ? 'ready' : 'error';
    activeController = null;
    return { feeds: feeds.value, errors: errors.value };
  }

  function setSources(nextSources: readonly RssFeedSourceInput[]) {
    const normalized = normalizeSources(nextSources);
    const sourceByUrl = new Map(normalized.map((source) => [source.url, source]));
    sources.value = normalized;
    feeds.value = feeds.value.flatMap((loaded): LoadedRssFeed[] => {
      const source = sourceByUrl.get(loaded.source.url);
      return source ? [{ ...loaded, source }] : [];
    });
    for (const url of cache.keys()) {
      if (!sourceByUrl.has(url)) cache.delete(url);
    }
  }

  function addSource(input: RssFeedSourceInput) {
    const source = normalizeSource(input);
    if (!source || sources.value.some((candidate) => candidate.url === source.url)) return false;
    sources.value = [...sources.value, source];
    return true;
  }

  function removeSource(url: string) {
    const normalizedUrl = resolveWebUrl(url);
    if (!normalizedUrl) return false;
    const nextSources = sources.value.filter((source) => source.url !== normalizedUrl);
    if (nextSources.length === sources.value.length) return false;
    sources.value = nextSources;
    feeds.value = feeds.value.filter(({ source }) => source.url !== normalizedUrl);
    cache.delete(normalizedUrl);
    return true;
  }

  function cancel() {
    activeController?.abort();
    activeController = null;
    if (status.value === 'loading') status.value = feeds.value.length > 0 ? 'ready' : 'idle';
  }

  onMounted(() => {
    if (options.immediate !== false) void refresh();
  });
  onUnmounted(cancel);

  return {
    sources: readonly(sources),
    feeds: readonly(feeds),
    items,
    errors: readonly(errors),
    status: readonly(status),
    isLoading: computed(() => status.value === 'loading'),
    lastUpdatedAt: readonly(lastUpdatedAt),
    parse: parseRssFeed,
    refresh,
    cancel,
    setSources,
    addSource,
    removeSource,
  };
}

// Common naming variants kept as aliases for callers that think of this as a parser or stream.
export const useRSS = useRss;
export const useRssParser = useRss;
