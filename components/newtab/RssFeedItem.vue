<script setup lang="ts">
import IconGlyph from '@/components/IconGlyph.vue';
import type { RssItem } from './types';

const props = defineProps<{ item: RssItem }>();
defineEmits<{ (event: 'select'): void }>();

const accentStyle = { '--item-accent': props.item.accent };
</script>

<template>
  <button type="button" class="feed-item" :style="accentStyle" @click="$emit('select')">
    <span class="feed-index" aria-hidden="true">
      <i></i>
      {{ String(item.id).padStart(2, '0') }}
    </span>
    <span class="feed-copy">
      <strong>{{ item.title }}</strong>
      <span>{{ item.source }} · {{ item.detail }}</span>
    </span>
    <IconGlyph name="arrow" :size="14" />
  </button>
</template>
