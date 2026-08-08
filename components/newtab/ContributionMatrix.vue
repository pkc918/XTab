<script setup lang="ts">
import { computed } from 'vue';
import type { GithubContributionDay } from './types';

const props = withDefaults(defineProps<{
  days: readonly GithubContributionDay[];
  total: number;
  loading?: boolean;
}>(), {
  loading: false,
});

const contributionWeekCount = 14;
const placeholderDays = Array.from({ length: contributionWeekCount * 7 }, (_, index): GithubContributionDay => ({
  date: '',
  count: 0,
  level: 0,
  week: Math.floor(index / 7),
  weekday: index % 7,
}));
const visibleDays = computed(() => {
  const cells = [...placeholderDays];

  for (const day of props.days) {
    if (
      !Number.isInteger(day.week)
      || !Number.isInteger(day.weekday)
      || day.week < 0
      || day.week >= contributionWeekCount
      || day.weekday < 0
      || day.weekday > 6
    ) continue;

    cells[(day.week * 7) + day.weekday] = day;
  }

  return cells;
});
const matrixLabel = computed(() => props.days.length > 0
  ? `最近三个月共 ${props.total} 次 GitHub 贡献。`
  : 'GitHub 贡献热力图尚未载入。');

function dayLabel(day: GithubContributionDay) {
  if (!day.date) return undefined;
  return `${day.date}：${day.count} 次贡献`;
}

</script>

<template>
  <div
    class="contribution-scroll"
    role="img"
    :aria-label="matrixLabel"
    :aria-busy="loading"
  >
    <div class="contribution-grid" :class="{ 'is-placeholder': days.length === 0 }">
      <span
        v-for="day in visibleDays"
        :key="`${day.week}-${day.weekday}-${day.date}`"
        :class="`level-${day.level}`"
        :style="{ gridColumn: day.week + 1, gridRow: day.weekday + 1 }"
        :title="dayLabel(day)"
      ></span>
    </div>
  </div>
  <div class="contribution-legend" aria-hidden="true">
    <span>少</span>
    <i v-for="level in [0, 1, 2, 3, 4]" :key="level" :class="`level-${level}`"></i>
    <span>多</span>
  </div>
</template>
