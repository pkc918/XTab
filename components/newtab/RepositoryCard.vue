<script setup lang="ts">
import LucideIcon from '@/components/LucideIcon.vue';
import type { Repository } from './types';

const props = defineProps<{ repo: Repository; saved: boolean }>();
defineEmits<{ (event: 'toggle-save'): void }>();

const accentStyle = { '--repo-accent': props.repo.accent };
</script>

<template>
  <article class="repo-item" :style="accentStyle">
    <div class="repo-item-top">
      <span class="repo-mark"><LucideIcon name="repo" :size="17" /></span>
      <button
        type="button"
        class="save-button"
        :class="{ saved }"
        :aria-label="saved ? `取消收藏 ${repo.name}` : `收藏 ${repo.name}`"
        @click="$emit('toggle-save')"
      >
        <LucideIcon name="bookmark" :size="15" />
      </button>
    </div>
    <a :href="repo.href">
      <h3>{{ repo.name }}</h3>
      <p>{{ repo.description }}</p>
    </a>
    <div class="repo-meta">
      <span><i aria-hidden="true"></i>{{ repo.language }}</span>
      <span>示例推荐</span>
    </div>
  </article>
</template>
