<script setup lang="ts">
import LucideIcon from '@/components/LucideIcon.vue';
import type { TrendingRepo } from './types';

const props = defineProps<{ repo: TrendingRepo }>();

const accentStyle = { '--repo-accent': props.repo.accent };

function formatCount(value: number) {
  if (value >= 1000) {
    const k = value / 1000;
    const rounded = Math.round(k * 10) / 10;
    return `${rounded.toFixed(1)}k`;
  }
  return String(value);
}
</script>

<template>
  <article class="repo-item" :style="accentStyle">
    <a :href="repo.url" class="repo-item-link">
      <div class="repo-item-top">
        <h3 class="repo-item-title">{{ repo.name }}</h3>
      </div>

      <p class="repo-item-description">{{ repo.description }}</p>

      <div class="repo-meta">
        <span><i aria-hidden="true"></i>{{ repo.language }}</span>
        <div class="repo-item-stats">
          <span class="repo-stat" :aria-label="`${repo.stars} stars`" title="Stars">
            <LucideIcon name="star" :size="11" />{{ formatCount(repo.stars) }}
          </span>
          <span class="repo-stat" :aria-label="`${repo.forks} forks`" title="Forks">
            <LucideIcon name="fork" :size="11" />{{ formatCount(repo.forks) }}
          </span>
        </div>
      </div>
    </a>
  </article>
</template>
