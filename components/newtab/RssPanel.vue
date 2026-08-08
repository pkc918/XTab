<script setup lang="ts">
import { computed, ref } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';
import RssFeedItem from './RssFeedItem.vue';
import type { FeedCategory, RssItem } from './types';

const props = withDefaults(defineProps<{
  items: RssItem[];
  isLoading?: boolean;
  hasSources?: boolean;
  errorMessage?: string;
}>(), {
  isLoading: false,
  hasSources: false,
  errorMessage: '',
});
const emit = defineEmits<{
  (event: 'notify', message: string): void;
  (event: 'open-settings'): void;
  (event: 'refresh'): void;
}>();

const categories: FeedCategory[] = ['全部', '开发', '设计', 'AI'];
const activeFeed = ref<FeedCategory>('全部');
const filteredItems = computed(() => activeFeed.value === '全部'
  ? props.items
  : props.items.filter((item) => item.category === activeFeed.value));
const panelSubtitle = computed(() => {
  if (props.isLoading) return '正在更新';
  if (!props.hasSources) return '未配置来源';
  if (props.items.length > 0) return `${props.items.length} 篇最新内容`;
  if (props.errorMessage) return '更新失败';
  return '暂无内容';
});
const emptyTitle = computed(() => {
  if (!props.hasSources) return '还没有 RSS 来源';
  if (props.errorMessage) return '暂时无法读取订阅';
  if (activeFeed.value !== '全部') return `“${activeFeed.value}”分类暂无内容`;
  return '订阅中暂无内容';
});
const emptyDescription = computed(() => {
  if (!props.hasSources) return '在 .env.local 中配置 WXT_RSS_FEED_URLS 后即可开始阅读。';
  if (props.errorMessage) return props.errorMessage;
  return '刷新后会在这里显示最新条目。';
});
const feedStatus = computed(() => (
  props.isLoading
    ? '正在刷新 RSS 内容。'
    : `${activeFeed.value}分类，共 ${filteredItems.value.length} 篇文章。`
));
</script>

<template>
  <aside class="panel feed-panel" aria-labelledby="feed-title" :aria-busy="isLoading">
    <div class="panel-heading">
      <div class="panel-title-group">
        <span class="panel-icon panel-icon--rss"><LucideIcon name="rss" /></span>
        <div>
          <h2 id="feed-title">RSS 阅读</h2>
          <span>{{ panelSubtitle }}</span>
        </div>
      </div>
      <div class="panel-actions">
        <button
          type="button"
          :disabled="isLoading"
          :aria-label="isLoading ? '正在刷新 RSS' : '刷新 RSS'"
          :title="isLoading ? '正在刷新' : '刷新 RSS'"
          @click="emit('refresh')"
        >
          <LucideIcon name="refresh" :size="16" :class="{ 'feed-refresh-icon--spinning': isLoading }" />
        </button>
        <button type="button" aria-label="管理 RSS 来源" title="管理 RSS 来源" @click="emit('open-settings')">
          <LucideIcon name="filter" :size="16" />
        </button>
      </div>
    </div>

    <div class="tab-row" role="group" aria-label="RSS 分类筛选">
      <button
        v-for="category in categories"
        :key="category"
        type="button"
        :aria-pressed="activeFeed === category"
        :class="{ active: activeFeed === category }"
        @click="activeFeed = category"
      >
        {{ category }}
      </button>
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

    <button class="panel-footer-action" type="button" @click="emit('open-settings')">
      <span>{{ hasSources ? '管理订阅来源' : '配置订阅来源' }}</span>
      <LucideIcon name="arrow" :size="15" />
    </button>
  </aside>
</template>
