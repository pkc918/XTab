<script setup lang="ts">
defineProps<{ levels: number[] }>();
</script>

<template>
  <div class="contribution-grid" aria-hidden="true">
    <span v-for="(level, index) in levels" :key="index" :class="`level-${level}`"></span>
  </div>
  <div class="contribution-legend" aria-hidden="true">
    <span>少</span>
    <i v-for="level in [0, 1, 2, 3, 4]" :key="level" :class="`level-${level}`"></i>
    <span>多</span>
  </div>
</template>
