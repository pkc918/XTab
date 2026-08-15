<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';
import RssFeedItem from './RssFeedItem.vue';
import type { RssItem, RssSourceTab } from './types';

const props = withDefaults(defineProps<{
  items: RssItem[];
  sources: readonly RssSourceTab[];
  isLoading?: boolean;
  errorMessage?: string;
}>(), {
  isLoading: false,
  errorMessage: '',
});
const emit = defineEmits<{
  (event: 'notify', message: string): void;
  (event: 'refresh'): void;
  (event: 'add-feed', url: string): void;
  (event: 'remove-feed', url: string): void;
}>();

const activeSourceUrl = ref('');
const isAddingFeed = ref(false);
const newFeedUrl = ref('');
const newFeedInput = ref<HTMLInputElement | null>(null);
const failedSourceIcons = ref<Set<string>>(new Set());

watch(() => props.sources, (sources) => {
  if (sources.length === 0) {
    activeSourceUrl.value = '';
    return;
  }
  if (!sources.some((source) => source.url === activeSourceUrl.value)) {
    activeSourceUrl.value = sources[0].url;
  }
}, { immediate: true });

const activeSource = computed(() => (
  props.sources.find((source) => source.url === activeSourceUrl.value) ?? null
));
const filteredItems = computed(() => props.items
  .filter((item) => item.sourceUrl === activeSourceUrl.value));
const panelSubtitle = computed(() => {
  if (props.isLoading) return '正在更新';
  if (props.sources.length === 0) return '未添加来源';
  if (activeSource.value) return activeSource.value.title;
  if (props.errorMessage) return '更新失败';
  return '暂无内容';
});
const emptyTitle = computed(() => {
  if (props.sources.length === 0) return '还没有 RSS 来源';
  if (props.errorMessage) return '暂时无法读取订阅';
  return `“${activeSource.value?.title ?? '当前 Feed'}”暂无内容`;
});
const emptyDescription = computed(() => {
  if (props.sources.length === 0) return '点击 Add Feed，输入 RSS 或 Atom 地址即可开始阅读。';
  if (props.errorMessage) return props.errorMessage;
  return '刷新后会在这里显示最新条目。';
});
const feedStatus = computed(() => (
  props.isLoading
    ? '正在刷新 RSS 内容。'
    : `${activeSource.value?.title ?? '当前 Feed'}，共 ${filteredItems.value.length} 篇文章。`
));

function visibleSourceIconUrl(source: RssSourceTab) {
  return [source.iconUrl, source.fallbackIconUrl].find((url): url is string => (
    Boolean(url && !failedSourceIcons.value.has(url))
  ));
}

function markSourceIconFailed(source: RssSourceTab) {
  const iconUrl = visibleSourceIconUrl(source);
  if (!iconUrl) return;
  failedSourceIcons.value = new Set([...failedSourceIcons.value, iconUrl]);
}

async function openAddFeed() {
  newFeedUrl.value = '';
  isAddingFeed.value = true;
  await nextTick();
  newFeedInput.value?.focus({ preventScroll: true });
}

function cancelAddFeed() {
  newFeedUrl.value = '';
  isAddingFeed.value = false;
}

function submitFeed() {
  const value = newFeedUrl.value.trim();
  if (!value) {
    emit('notify', '请输入 Feed 地址。');
    return;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error();
    activeSourceUrl.value = url.href;
    emit('add-feed', url.href);
    cancelAddFeed();
  } catch {
    emit('notify', '请输入有效的 HTTP 或 HTTPS Feed 地址。');
  }
}
</script>

<template>
  <aside class="panel feed-panel" aria-labelledby="feed-title" :aria-busy="isLoading">
    <div class="panel-top">
      <div class="panel-header">
        <span class="panel-icon panel-icon--rss"><LucideIcon name="rss" /></span>
        <div>
          <h2 id="feed-title">RSS 阅读</h2>
          <span>{{ panelSubtitle }}</span>
        </div>
      </div>
      <div class="panel-controls">
        <button
          type="button"
          class="panel-refresh-button"
          :disabled="isLoading"
          :aria-label="isLoading ? '正在刷新 RSS' : '刷新 RSS'"
          :title="isLoading ? '正在刷新' : '刷新 RSS'"
          @click="emit('refresh')"
        >
          <LucideIcon name="refresh" :size="15" :class="{ 'panel-refresh-icon--spinning': isLoading }" />
        </button>
      </div>
    </div>

    <div class="tab-row rss-source-tabs">
      <form v-if="isAddingFeed" class="rss-add-feed-form" @submit.prevent="submitFeed">
        <input
          ref="newFeedInput"
          v-model="newFeedUrl"
          type="url"
          inputmode="url"
          autocomplete="url"
          placeholder="https://example.com/feed.xml"
          aria-label="Feed 地址"
          @keydown.esc="cancelAddFeed"
        />
        <button type="submit">添加</button>
        <button type="button" @click="cancelAddFeed">取消</button>
      </form>

      <div v-else class="rss-tab-scroller" role="tablist" aria-label="RSS Feed 来源">
        <button
          v-for="source in sources"
          :key="source.url"
          type="button"
          role="tab"
          :title="source.title"
          :aria-label="source.title"
          :aria-selected="activeSourceUrl === source.url"
          :class="{
            active: activeSourceUrl === source.url,
            'rss-source-tab--icon-only': source.icon || visibleSourceIconUrl(source),
          }"
          @click="activeSourceUrl = source.url"
        >
          <component :is="source.icon" v-if="source.icon" class="rss-source-logo" width="17" height="17" />
          <img
            v-else-if="visibleSourceIconUrl(source)"
            class="rss-source-logo rss-source-logo--image"
            :src="visibleSourceIconUrl(source)"
            alt=""
            width="17"
            height="17"
            decoding="async"
            referrerpolicy="no-referrer"
            @error="markSourceIconFailed(source)"
          >
          <span v-else>{{ source.title }}</span>
        </button>
        <button type="button" class="rss-add-feed-button" @click="openAddFeed">
          <LucideIcon name="plus" :size="14" />
          <span>Add Feed</span>
        </button>
      </div>
    </div>

    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ feedStatus }}</p>

    <ul v-if="filteredItems.length > 0" class="feed-list">
      <li v-for="(item, index) in filteredItems" :key="item.id">
        <RssFeedItem
          :item="item"
          :index="index + 1"
          @select="emit('notify', '这篇内容没有可打开的文章链接。')"
        />
      </li>
    </ul>

    <div v-else class="feed-empty" role="status">
      <span class="feed-empty-icon" aria-hidden="true"><LucideIcon name="rss" :size="22" /></span>
      <strong>{{ emptyTitle }}</strong>
      <p>{{ emptyDescription }}</p>
    </div>

    <button
      v-if="activeSource"
      class="panel-footer-action feed-remove-action"
      type="button"
      :aria-label="`删除 Feed：${activeSource.title}`"
      @click="emit('remove-feed', activeSource.url)"
    >
      <LucideIcon name="trash" :size="15" />
      <span>删除 {{ activeSource.title }}</span>
    </button>
  </aside>
</template>
