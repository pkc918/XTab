<script setup lang="ts">
import { computed } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';
import type { RssItem } from './types';

const props = defineProps<{ item: RssItem; index?: number }>();
defineEmits<{ (event: 'select'): void }>();

const accentStyle = computed(() => ({ '--item-accent': props.item.accent }));
const displayIndex = computed(() => String(props.index ?? props.item.id).padStart(2, '0'));
</script>

<template>
  <component
    :is="item.href ? 'a' : 'button'"
    class="feed-item"
    :style="accentStyle"
    :href="item.href"
    :target="item.href ? '_blank' : undefined"
    :rel="item.href ? 'noopener noreferrer' : undefined"
    :type="item.href ? undefined : 'button'"
    @click="!item.href && $emit('select')"
  >
    <span class="feed-index" aria-hidden="true">
      <i></i>
      {{ displayIndex }}
    </span>
    <span class="feed-copy">
      <strong>{{ item.title }}</strong>
      <span>{{ item.source }} · {{ item.detail }}</span>
    </span>
    <LucideIcon name="arrow" :size="14" />
  </component>
</template>
