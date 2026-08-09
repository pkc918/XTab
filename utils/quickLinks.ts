import type { QuickLink } from '@/components/newtab/types';
import { resolveWebUrl, websiteNameFromUrl, webUrlKey } from './urls';

const accentPalette = [
  '#7c3aed',
  '#2563eb',
  '#06b6d4',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#f59e0b',
  '#64748b',
];

function iconForHostname(hostname: string): QuickLink['icon'] {
  if (hostname === 'github.com' || hostname.endsWith('.github.com')) return 'github';
  if (hostname === 'vercel.com' || hostname.endsWith('.vercel.com')) return 'triangle';
  if (hostname === 'developer.mozilla.org') return 'book';
  if (hostname === 'news.ycombinator.com') return 'terminal';
  if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com') || hostname === 'youtu.be') return 'play';
  if (hostname === 'stackoverflow.com' || hostname.endsWith('.stackoverflow.com')) return 'layers';
  if (hostname === 'google.com' || hostname.endsWith('.google.com')) return 'google';
  return 'globe';
}

function accentForHostname(hostname: string) {
  let hash = 0;
  for (const character of hostname) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  return accentPalette[Math.abs(hash) % accentPalette.length];
}

export function createQuickLink(name: string, value: string): QuickLink | null {
  const href = resolveWebUrl(value);
  if (!href) return null;

  const hostname = new URL(href).hostname.toLowerCase();
  const normalizedName = name.trim() || websiteNameFromUrl(href);
  if (!normalizedName) return null;

  return {
    name: normalizedName.slice(0, 40),
    href,
    icon: iconForHostname(hostname),
    accent: accentForHostname(hostname),
    removable: true,
  };
}

export function parseStoredQuickLinks(value: unknown, reservedLinks: QuickLink[]) {
  if (!Array.isArray(value)) return [];

  const seen = new Set(reservedLinks.map((link) => webUrlKey(link.href)).filter(Boolean));
  const links: QuickLink[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const record = item as { name?: unknown; href?: unknown };
    if (typeof record.name !== 'string' || typeof record.href !== 'string') continue;

    const link = createQuickLink(record.name, record.href);
    const key = link ? webUrlKey(link.href) : null;
    if (!link || !key || seen.has(key)) continue;

    seen.add(key);
    links.push(link);
  }

  return links;
}

export function serializeQuickLinks(links: QuickLink[]) {
  return links.map(({ name, href }) => ({ name, href }));
}
