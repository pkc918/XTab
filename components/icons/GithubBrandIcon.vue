<script setup lang="ts">
import type { IconProps } from './types';

withDefaults(
  defineProps<IconProps>(),
  {
    size: 18,
    color: 'currentColor',
    strokeWidth: 1.7,
    absoluteStrokeWidth: false,
  },
);
</script>

<template>
  <svg
    :width="size"
    :height="size"
    :color="color"
    viewBox="0 0 24 24"
    fill="none"
    focusable="false"
  >
    <path d="M12 2.8a9.2 9.2 0 0 0-2.9 17.9c.5.1.7-.2.7-.5v-1.8c-3 .7-3.6-1.3-3.6-1.3-.5-1.2-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 1.7 2.5 1.2 3.1.9.1-.7.4-1.2.7-1.5-2.4-.3-4.9-1.2-4.9-5.3 0-1.2.4-2.1 1.1-2.9-.1-.3-.5-1.4.1-2.9 0 0 .9-.3 3 1.1a10.3 10.3 0 0 1 5.4 0c2.1-1.4 3-1.1 3-1.1.6 1.5.2 2.6.1 2.9.7.8 1.1 1.7 1.1 2.9 0 4.1-2.5 5-4.9 5.3.4.3.7 1 .7 2v2.9c0 .3.2.6.7.5A9.2 9.2 0 0 0 12 2.8Z" fill="currentColor" stroke="none" />
  </svg>
</template>
