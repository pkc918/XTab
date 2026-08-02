<script setup lang="ts">
import IconGlyph from '@/components/IconGlyph.vue';
import type { QuickLink } from './types';

defineProps<{ links: QuickLink[] }>();
defineEmits<{ (event: 'open-settings'): void }>();

function accentStyle(accent: string) {
  return { '--link-accent': accent };
}
</script>

<template>
  <nav class="quick-links" aria-label="快捷网站">
    <a v-for="link in links" :key="link.name" :href="link.href" :style="accentStyle(link.accent)">
      <IconGlyph class="quick-link-icon" :name="link.icon" :size="17" />
      <span>{{ link.name }}</span>
    </a>
    <button type="button" @click="$emit('open-settings')">
      <IconGlyph name="plus" :size="17" />
      <span>添加</span>
    </button>
  </nav>
</template>
