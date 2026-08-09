<script setup lang="ts">
import LucideIcon from '@/components/LucideIcon.vue';
import type { QuickLink } from './types';

defineProps<{ links: QuickLink[] }>();
defineEmits<{
  (event: 'add-link'): void;
  (event: 'remove-link', link: QuickLink): void;
}>();

function accentStyle(accent: string) {
  return { '--link-accent': accent };
}
</script>

<template>
  <div class="quick-links-scroll">
    <nav class="quick-links" aria-label="快捷网站">
      <span
        v-for="link in links"
        :key="link.href"
        class="quick-link-item"
        :class="{ 'quick-link-item--removable': link.removable }"
        :style="accentStyle(link.accent)"
      >
        <a :href="link.href" :title="link.href">
          <LucideIcon class="quick-link-icon" :name="link.icon" :size="17" />
          <span>{{ link.name }}</span>
        </a>
        <button
          v-if="link.removable"
          class="quick-link-delete-button"
          type="button"
          :aria-label="`删除快捷网站「${link.name}」`"
          :title="`删除「${link.name}」`"
          @click.stop="$emit('remove-link', link)"
        >
          <LucideIcon name="trash" :size="13" />
        </button>
      </span>
      <button class="quick-link-add-button" type="button" aria-label="添加快捷网站" @click="$emit('add-link')">
        <LucideIcon name="plus" :size="17" />
        <span>添加</span>
      </button>
    </nav>
  </div>
</template>
