<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import CommandZone from '@/components/newtab/CommandZone.vue';
import GithubDeviceAuthDialog from '@/components/newtab/GithubDeviceAuthDialog.vue';
import GithubProfilePanel from '@/components/newtab/GithubProfilePanel.vue';
import NewTabHeader from '@/components/newtab/NewTabHeader.vue';
import RepositoryPanel from '@/components/newtab/RepositoryPanel.vue';
import RssPanel from '@/components/newtab/RssPanel.vue';
import ToastNotice from '@/components/newtab/ToastNotice.vue';
import type { FeedCategory, RssItem, Theme } from '@/components/newtab/types';
import { useGithubAuth } from '@/composables/useGithubAuth';
import { useGithubProfile } from '@/composables/useGithubProfile';
import { useRss, type RssFeedSourceInput, type RssStreamItem } from '@/composables/useRss';
import { quickLinks, repositories } from './data';

type ArticleCategory = Exclude<FeedCategory, '全部'>;

const rssCategoryAccents: Record<ArticleCategory, string> = {
  开发: '#06b6d4',
  设计: '#ec4899',
  AI: '#8b5cf6',
};

function configuredRssSources(): RssFeedSourceInput[] {
  const value = String(import.meta.env.WXT_RSS_FEED_URLS ?? '').trim();
  if (!value) return [];

  if (value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((source: unknown): source is RssFeedSourceInput => (
          typeof source === 'string'
          || (typeof source === 'object' && source !== null && typeof (source as { url?: unknown }).url === 'string')
        ));
      }
    } catch {
      // Fall back to the comma/newline format below.
    }
  }

  return value.split(/[\n,]+/).map((source) => source.trim()).filter(Boolean);
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
let noticeTimer: ReturnType<typeof setTimeout> | undefined;

document.documentElement.dataset.theme = theme.value;

function setTheme(nextTheme: Theme) {
  theme.value = nextTheme;
  document.documentElement.dataset.theme = nextTheme;
}

function toggleTheme() {
  setTheme(theme.value === 'light' ? 'dark' : 'light');
}

function showNotice(message: string, duration = 3600) {
  notice.value = message;
  if (noticeTimer) clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    notice.value = '';
  }, duration);
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
  items: rssStreamItems,
  errors: rssErrors,
  isLoading: rssIsLoading,
  refresh: refreshRssFeeds,
} = useRss(configuredRssSources());
const rssItems = computed<RssItem[]>(() => rssStreamItems.value.slice(0, 8).map((item) => {
  const category = inferRssCategory(item);
  return {
    id: `${item.sourceUrl}:${item.id}`,
    title: item.title,
    category,
    source: item.feedTitle,
    detail: feedItemDetail(item),
    accent: rssCategoryAccents[category],
    href: item.url || item.externalUrl,
    publishedAt: item.publishedAt,
  };
}));
const rssErrorMessage = computed(() => rssErrors.value[0]?.message ?? '');

async function refreshRss() {
  const result = await refreshRssFeeds({ force: true, requestPermissions: true });
  if (result.errors.length > 0) {
    showNotice(result.errors[0].message, 7_000);
  } else if (result.feeds.length > 0) {
    showNotice(`已更新 ${rssItems.value.length} 篇 RSS 内容。`);
  }
}

function openSettings() {
  showNotice('设置与快捷入口配置将在数据层接入后开放。');
}

function openRssSettings() {
  showNotice('请在 .env.local 的 WXT_RSS_FEED_URLS 中配置订阅来源，然后重新构建扩展。', 7_000);
}

watch(theme, (nextTheme) => {
  try {
    localStorage.setItem('xtab-theme', nextTheme);
  } catch {
    // The active theme still works for this tab when persistence is unavailable.
  }
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
      <CommandZone :links="quickLinks" @open-settings="openSettings" />

      <section class="dashboard" aria-label="XTab 信息工作台">
        <RssPanel
          :items="rssItems"
          :is-loading="rssIsLoading"
          :has-sources="rssSources.length > 0"
          :error-message="rssErrorMessage"
          @notify="showNotice"
          @refresh="refreshRss"
          @open-settings="openRssSettings"
        />
        <RepositoryPanel :repositories="repositories" />
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

    <GithubDeviceAuthDialog
      :authorization="deviceAuthorization"
      @copy-code="copyGithubDeviceCode"
      @open-github="openGithubVerificationPage"
      @cancel="cancelGithubAuthorization"
    />
    <ToastNotice :message="notice" @close="notice = ''" />
  </div>
</template>
