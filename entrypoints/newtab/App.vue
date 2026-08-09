<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import AnthropicIcon from '@iconify-vue/simple-icons/anthropic';
import OpenAiIcon from '@iconify-vue/simple-icons/openai';
import CommandZone from '@/components/newtab/CommandZone.vue';
import GithubDeviceAuthDialog from '@/components/newtab/GithubDeviceAuthDialog.vue';
import GithubProfilePanel from '@/components/newtab/GithubProfilePanel.vue';
import NewTabHeader from '@/components/newtab/NewTabHeader.vue';
import QuickLinkDialog from '@/components/newtab/QuickLinkDialog.vue';
import QuickLinkDeleteDialog from '@/components/newtab/QuickLinkDeleteDialog.vue';
import RepositoryPanel from '@/components/newtab/RepositoryPanel.vue';
import RssPanel from '@/components/newtab/RssPanel.vue';
import ToastNotice from '@/components/newtab/ToastNotice.vue';
import type { FeedCategory, QuickLink, RssItem, RssSourceTab, Theme } from '@/components/newtab/types';
import { useGithubAuth } from '@/composables/useGithubAuth';
import { useGithubProfile } from '@/composables/useGithubProfile';
import { useRss, type RssFeedSourceInput, type RssStreamItem } from '@/composables/useRss';
import { useGithubTrending } from '@/composables/useGithubTrending';
import { createQuickLink, parseStoredQuickLinks, serializeQuickLinks } from '@/utils/quickLinks';
import { webUrlKey } from '@/utils/urls';
import { quickLinks as defaultQuickLinks } from './data';

type ArticleCategory = Exclude<FeedCategory, '全部'>;
const rssSourcesStorageKey = 'xtab-rss-sources';
const rssDefaultsVersionStorageKey = 'xtab-rss-defaults-version';
const quickLinksStorageKey = 'xtab-quick-links';
const hiddenQuickLinksStorageKey = 'xtab-hidden-quick-links';
const currentRssDefaultsVersion = 2;
const defaultOpenAiRssUrl = 'https://openai.com/news/rss.xml';
const legacyOpenAiRssUrl = 'https://openrss.org/openai.com/news/rss.xml';
const defaultClaudeRssUrl = 'https://code.claude.com/docs/en/whats-new/rss.xml';
const defaultRssSources: RssFeedSourceInput[] = [
  {
    url: defaultOpenAiRssUrl,
    title: 'OpenAI News',
    category: 'AI',
  },
  {
    url: defaultClaudeRssUrl,
    title: 'Claude Code',
    category: 'AI',
  },
];

const rssCategoryAccents: Record<ArticleCategory, string> = {
  开发: '#06b6d4',
  设计: '#ec4899',
  AI: '#8b5cf6',
};

function configuredRssSources(): RssFeedSourceInput[] {
  const value = String(import.meta.env.WXT_RSS_FEED_URLS ?? '').trim();
  if (!value) return defaultRssSources;

  if (value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return [...defaultRssSources, ...parsed.filter(isRssFeedSourceInput)];
      }
    } catch {
      // Fall back to the comma/newline format below.
    }
  }

  return [
    ...defaultRssSources,
    ...value.split(/[\n,]+/).map((source) => source.trim()).filter(Boolean),
  ];
}

function isRssFeedSourceInput(source: unknown): source is RssFeedSourceInput {
  return typeof source === 'string'
    || (typeof source === 'object'
      && source !== null
      && typeof (source as { url?: unknown }).url === 'string');
}

function inferRssCategory(item: RssStreamItem): ArticleCategory {
  if (item.sourceCategory === '开发' || item.sourceCategory === '设计' || item.sourceCategory === 'AI') {
    return item.sourceCategory;
  }

  const terms = `${item.title} ${item.tags.join(' ')}`.toLowerCase();
  if (/\b(ai|llm|gpt|machine learning|deep learning|neural)\b|人工智能|大模型|机器学习/i.test(terms)) {
    return 'AI';
  }
  if (/\b(design|designer|ui|ux|typography|figma)\b|设计|交互|排版|视觉/i.test(terms)) {
    return '设计';
  }
  return '开发';
}

function feedItemDetail(item: RssStreamItem) {
  const publishedAt = item.publishedAt || item.updatedAt;
  if (publishedAt) {
    const date = new Date(publishedAt);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat('zh-CN', {
        month: 'short',
        day: 'numeric',
      }).format(date);
    }
  }

  const chineseCharacters = (item.content.match(/[\u3400-\u9fff]/g) ?? []).length;
  const latinWords = (item.content.match(/[a-z0-9]+/gi) ?? []).length;
  const minutes = Math.max(1, Math.ceil((chineseCharacters + latinWords * 2) / 400));
  return `约 ${minutes} 分钟`;
}

function getInitialTheme(): Theme {
  try {
    const storedTheme = localStorage.getItem('xtab-theme');
    if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;
  } catch {
    // Theme persistence can be unavailable in restricted extension contexts.
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const theme = ref<Theme>(getInitialTheme());
const notice = ref('');
const customQuickLinks = ref<QuickLink[]>([]);
const hiddenQuickLinkKeys = ref<string[]>([]);
const quickLinkDialogOpen = ref(false);
const pendingQuickLinkRemoval = ref<QuickLink | null>(null);
const quickLinkDeleteBusy = ref(false);
const visibleQuickLinks = computed(() => {
  const hidden = new Set(hiddenQuickLinkKeys.value);
  return [
    ...defaultQuickLinks
      .filter((link) => !hidden.has(webUrlKey(link.href) ?? ''))
      .map((link) => ({ ...link, removable: true })),
    ...customQuickLinks.value,
  ];
});
let noticeTimer: ReturnType<typeof setTimeout> | undefined;

document.documentElement.dataset.theme = theme.value;
document.documentElement.classList.toggle('dark', theme.value === 'dark');

function setTheme(nextTheme: Theme) {
  theme.value = nextTheme;
  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.classList.toggle('dark', nextTheme === 'dark');
}

function toggleTheme(event: MouseEvent) {
  // @ts-expect-error View Transition is available only in supporting browsers.
  const isAppearanceTransition = document.startViewTransition
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!isAppearanceTransition) {
    setTheme(theme.value === 'light' ? 'dark' : 'light');
    return;
  }

  const button = event.currentTarget as HTMLElement;
  const target = button.querySelector('svg') ?? button;
  const targetRect = target.getBoundingClientRect();
  const x = targetRect.left + targetRect.width / 2;
  const y = targetRect.top + targetRect.height / 2;
  const endRadius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y),
  );
  const nextTheme: Theme = theme.value === 'light' ? 'dark' : 'light';
  const transition = document.startViewTransition(async () => {
    setTheme(nextTheme);
    await nextTick();
  });
  void transition.ready.then(() => {
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`,
    ];
    document.documentElement.animate(
      {
        clipPath: nextTheme === 'dark'
          ? [...clipPath].reverse()
          : clipPath,
      },
      {
        duration: 400,
        easing: 'ease-out',
        fill: 'forwards',
        pseudoElement: nextTheme === 'dark'
          ? '::view-transition-old(root)'
          : '::view-transition-new(root)',
      },
    );
  });
}

function showNotice(message: string, duration = 3600) {
  notice.value = message;
  if (noticeTimer) clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    notice.value = '';
  }, duration);
}

async function persistQuickLinks(
  links = customQuickLinks.value,
  hiddenKeys = hiddenQuickLinkKeys.value,
) {
  try {
    await browser.storage.local.set({
      [quickLinksStorageKey]: serializeQuickLinks(links),
      [hiddenQuickLinksStorageKey]: hiddenKeys,
    });
    return true;
  } catch {
    return false;
  }
}

async function addQuickLink(value: { name: string; href: string }) {
  const link = createQuickLink(value.name, value.href);
  if (!link) {
    showNotice('网站地址无效，请检查后重试。');
    return;
  }

  const key = webUrlKey(link.href);
  if (visibleQuickLinks.value.some((item) => webUrlKey(item.href) === key)) {
    showNotice('这个网站已经在快捷入口中。');
    return;
  }

  customQuickLinks.value = [...customQuickLinks.value, link];
  quickLinkDialogOpen.value = false;
  const persisted = await persistQuickLinks();
  showNotice(persisted
    ? `已添加「${link.name}」。`
    : `已添加「${link.name}」，但暂时无法保存到本地。`);
}

async function removeQuickLink() {
  const link = pendingQuickLinkRemoval.value;
  const key = link ? webUrlKey(link.href) : null;
  if (!link?.removable || !key) {
    pendingQuickLinkRemoval.value = null;
    return;
  }

  const isCustomLink = customQuickLinks.value.some((item) => webUrlKey(item.href) === key);
  const isDefaultLink = defaultQuickLinks.some((item) => webUrlKey(item.href) === key);
  if (!isCustomLink && !isDefaultLink) {
    pendingQuickLinkRemoval.value = null;
    return;
  }

  const remainingLinks = isCustomLink
    ? customQuickLinks.value.filter((item) => webUrlKey(item.href) !== key)
    : customQuickLinks.value;
  const nextHiddenKeys = isDefaultLink && !hiddenQuickLinkKeys.value.includes(key)
    ? [...hiddenQuickLinkKeys.value, key]
    : hiddenQuickLinkKeys.value;

  quickLinkDeleteBusy.value = true;
  const persisted = await persistQuickLinks(remainingLinks, nextHiddenKeys);
  quickLinkDeleteBusy.value = false;

  if (!persisted) {
    pendingQuickLinkRemoval.value = null;
    showNotice(`无法删除「${link.name}」，本地存储暂时不可用。`);
    return;
  }

  customQuickLinks.value = remainingLinks;
  hiddenQuickLinkKeys.value = nextHiddenKeys;
  pendingQuickLinkRemoval.value = null;
  await nextTick();
  document.querySelector<HTMLButtonElement>('.quick-link-add-button')?.focus();
  showNotice(`已删除「${link.name}」。`);
}

async function loadQuickLinks() {
  try {
    const stored = await browser.storage.local.get([
      quickLinksStorageKey,
      hiddenQuickLinksStorageKey,
    ]);
    const defaultKeys = new Set(defaultQuickLinks.map((link) => webUrlKey(link.href)).filter(Boolean));
    const savedHiddenKeys = Array.isArray(stored[hiddenQuickLinksStorageKey])
      ? stored[hiddenQuickLinksStorageKey]
        .filter((value): value is string => typeof value === 'string')
        .map((value) => webUrlKey(value))
        .filter((value): value is string => Boolean(value && defaultKeys.has(value)))
      : [];
    hiddenQuickLinkKeys.value = [...new Set(savedHiddenKeys)];
    const hidden = new Set(hiddenQuickLinkKeys.value);
    const visibleDefaults = defaultQuickLinks.filter((link) => !hidden.has(webUrlKey(link.href) ?? ''));
    customQuickLinks.value = parseStoredQuickLinks(stored[quickLinksStorageKey], visibleDefaults);
  } catch {
    showNotice('无法读取已保存的快捷网站，本次将只显示默认入口。');
  }
}

const {
  githubUser,
  githubAuthState,
  deviceAuthorization,
  connectGithub,
  copyGithubDeviceCode,
  openGithubVerificationPage,
  cancelGithubAuthorization,
  githubFetch,
} = useGithubAuth({
  notify: showNotice,
  scopes: ['read:user'],
});
const {
  contributionDays,
  contributionTotal,
  activities: githubActivities,
  contributionsLoading,
  activityLoading,
  contributionsError,
  activityError,
  refreshGithubProfile,
} = useGithubProfile(githubUser, githubFetch);
const {
  sources: rssSources,
  feeds: rssFeeds,
  items: rssStreamItems,
  errors: rssErrors,
  isLoading: rssIsLoading,
  refresh: refreshRssFeeds,
  setSources: setRssSources,
  addSource: addRssSource,
  removeSource: removeRssSource,
} = useRss(configuredRssSources(), { immediate: false });
const rssItems = computed<RssItem[]>(() => rssStreamItems.value.map((item) => {
  const category = inferRssCategory(item);
  return {
    id: `${item.sourceUrl}:${item.id}`,
    title: item.title,
    category,
    source: item.feedTitle,
    sourceUrl: item.sourceUrl,
    detail: feedItemDetail(item),
    accent: rssCategoryAccents[category],
    href: item.url || item.externalUrl,
    publishedAt: item.publishedAt,
  };
}));
const rssSourceTabs = computed<RssSourceTab[]>(() => rssSources.value.map((source) => {
  const loaded = rssFeeds.value.find((feed) => feed.source.url === source.url);
  let fallbackTitle = source.url;
  try {
    fallbackTitle = new URL(source.url).hostname;
  } catch {
    // Sources are normalized before reaching this point; retain the URL as a safe fallback.
  }
  return {
    url: source.url,
    title: source.title || loaded?.feed.title || fallbackTitle,
    icon: source.url === defaultOpenAiRssUrl
      ? OpenAiIcon
      : source.url === defaultClaudeRssUrl
        ? AnthropicIcon
        : undefined,
  };
}));
const rssErrorMessage = computed(() => rssErrors.value[0]?.message ?? '');

async function persistRssSources() {
  try {
    await browser.storage.local.set({
      [rssSourcesStorageKey]: rssSources.value.map((source) => ({ ...source })),
      [rssDefaultsVersionStorageKey]: currentRssDefaultsVersion,
    });
  } catch {
    showNotice('RSS 来源已更新，但暂时无法保存到本地。');
  }
}

async function refreshRss() {
  const result = await refreshRssFeeds({ force: true, requestPermissions: true });
  if (result.errors.length > 0) {
    showNotice(result.errors[0].message, 7_000);
  } else if (result.feeds.length > 0) {
    showNotice(`已更新 ${rssItems.value.length} 篇 RSS 内容。`);
  }
}

async function addRssFeed(url: string) {
  if (!addRssSource(url)) {
    showNotice('这个 Feed 已存在，或地址无效。');
    return;
  }

  const refreshPromise = refreshRssFeeds({ force: true, requestPermissions: true });
  await persistRssSources();
  const result = await refreshPromise;
  if (result.errors.length > 0) {
    showNotice(result.errors[0].message, 7_000);
    return;
  }
  showNotice('Feed 已添加。');
}

async function removeRssFeed(url: string) {
  const sourceTitle = rssSourceTabs.value.find((source) => source.url === url)?.title ?? 'Feed';
  if (!removeRssSource(url)) return;
  await persistRssSources();
  showNotice(`已删除「${sourceTitle}」。`);
}

const trendingLanguage = ref('全部');
const {
  repos: trendingRepos,
  loading: trendingLoading,
  error: trendingError,
  refresh: refreshTrending,
} = useGithubTrending(trendingLanguage);

function openSettings() {
  showNotice('更多设置与快捷入口管理仍在完善中；可使用搜索框下方的「添加」新增网站。');
}

watch(theme, (nextTheme) => {
  try {
    localStorage.setItem('xtab-theme', nextTheme);
  } catch {
    // The active theme still works for this tab when persistence is unavailable.
  }
});

onMounted(async () => {
  await loadQuickLinks();
  try {
    const stored = await browser.storage.local.get([
      rssSourcesStorageKey,
      rssDefaultsVersionStorageKey,
    ]);
    const savedSources = stored[rssSourcesStorageKey];
    if (Array.isArray(savedSources)) {
      const validSources = savedSources.filter(isRssFeedSourceInput);
      const hasLegacyOpenAiSource = validSources.some((source) => (
        typeof source === 'string'
          ? source === legacyOpenAiRssUrl
          : source.url === legacyOpenAiRssUrl
      ));
      const migratedSources = validSources.map((source) => {
        if (typeof source === 'string') {
          return source === legacyOpenAiRssUrl ? defaultOpenAiRssUrl : source;
        }
        return source.url === legacyOpenAiRssUrl
          ? { ...source, url: defaultOpenAiRssUrl }
          : source;
      });
      const shouldAddClaudeSource = stored[rssDefaultsVersionStorageKey] !== currentRssDefaultsVersion
        && !migratedSources.some((source) => (
          typeof source === 'string'
            ? source === defaultClaudeRssUrl
            : source.url === defaultClaudeRssUrl
        ));
      setRssSources(shouldAddClaudeSource
        ? [...migratedSources, defaultRssSources[1]]
        : migratedSources);
      if (hasLegacyOpenAiSource || shouldAddClaudeSource) await persistRssSources();
    }
  } catch {
    showNotice('无法读取已保存的 RSS 来源，将使用默认配置。');
  }
  await refreshRssFeeds();
});

onUnmounted(() => {
  if (noticeTimer) clearTimeout(noticeTimer);
});
</script>

<template>
  <div class="app-shell">
    <NewTabHeader
      :theme="theme"
      :github-auth-state="githubAuthState"
      :github-user="githubUser"
      @toggle-theme="toggleTheme"
      @open-settings="openSettings"
      @connect-github="connectGithub"
    />

    <main>
      <CommandZone
        :links="visibleQuickLinks"
        @add-link="quickLinkDialogOpen = true"
        @remove-link="pendingQuickLinkRemoval = $event"
      />

      <section class="dashboard" aria-label="XTab 信息工作台">
        <RssPanel
          :items="rssItems"
          :sources="rssSourceTabs"
          :is-loading="rssIsLoading"
          :error-message="rssErrorMessage"
          @notify="showNotice"
          @refresh="refreshRss"
          @add-feed="addRssFeed"
          @remove-feed="removeRssFeed"
        />
        <RepositoryPanel
          v-model:language="trendingLanguage"
          :repos="trendingRepos"
          :loading="trendingLoading"
          :error="trendingError"
          @refresh="refreshTrending"
        />
        <GithubProfilePanel
          :github-auth-state="githubAuthState"
          :github-user="githubUser"
          :contribution-days="contributionDays"
          :contribution-total="contributionTotal"
          :contributions-loading="contributionsLoading"
          :contributions-error="contributionsError"
          :activities="githubActivities"
          :activity-loading="activityLoading"
          :activity-error="activityError"
          @connect-github="connectGithub"
          @refresh-github="refreshGithubProfile"
        />
      </section>
    </main>

    <QuickLinkDialog
      :open="quickLinkDialogOpen"
      :existing-links="visibleQuickLinks"
      @add="addQuickLink"
      @close="quickLinkDialogOpen = false"
    />
    <QuickLinkDeleteDialog
      :link="pendingQuickLinkRemoval"
      :busy="quickLinkDeleteBusy"
      @confirm="removeQuickLink"
      @cancel="pendingQuickLinkRemoval = null"
    />

    <GithubDeviceAuthDialog
      :authorization="deviceAuthorization"
      @copy-code="copyGithubDeviceCode"
      @open-github="openGithubVerificationPage"
      @cancel="cancelGithubAuthorization"
    />
    <ToastNotice :message="notice" @close="notice = ''" />
  </div>
</template>
