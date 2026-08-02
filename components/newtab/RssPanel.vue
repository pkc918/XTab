<script setup lang="ts">
import { computed, ref } from 'vue';
import IconGlyph from '@/components/IconGlyph.vue';
import RssFeedItem from './RssFeedItem.vue';
import type { FeedCategory, RssItem } from './types';

const props = defineProps<{ items: RssItem[] }>();
const emit = defineEmits<{
  (event: 'notify', message: string): void;
  (event: 'open-settings'): void;
}>();

const categories: FeedCategory[] = ['全部', '开发', '设计', 'AI'];
const activeFeed = ref<FeedCategory>('全部');
const filteredItems = computed(() => activeFeed.value === '全部'
  ? props.items
  : props.items.filter((item) => item.category === activeFeed.value));
const feedStatus = computed(() => `${activeFeed.value}分类，共 ${filteredItems.value.length} 篇演示文章。`);
</script>

<template>
  <aside class="panel feed-panel" aria-labelledby="feed-title">
    <div class="panel-heading">
      <div class="panel-title-group">
        <span class="panel-icon panel-icon--rss"><IconGlyph name="rss" /></span>
        <div>
          <h2 id="feed-title">RSS 阅读</h2>
          <span>演示内容</span>
        </div>
      </div>
      <div class="panel-actions">
        <button type="button" aria-label="刷新 RSS" title="刷新 RSS" @click="emit('notify', '真实 RSS 数据源尚未接入。')">
          <IconGlyph name="refresh" :size="16" />
        </button>
        <button type="button" aria-label="管理 RSS 来源" title="管理 RSS 来源" @click="emit('open-settings')">
          <IconGlyph name="filter" :size="16" />
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

    <ul class="feed-list">
      <li v-for="item in filteredItems" :key="item.id">
        <RssFeedItem :item="item" @select="emit('notify', '这是排版用的演示文章；RSS 数据连接尚未启用。')" />
      </li>
    </ul>

    <button class="panel-footer-action" type="button" @click="emit('open-settings')">
      <span>管理订阅来源</span>
      <IconGlyph name="arrow" :size="15" />
    </button>
  </aside>
</template>
