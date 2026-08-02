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
    <g transform="translate(3 3)" stroke="none">
      <path fill="#4285f4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z" />
      <path fill="#34a853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.59-5.04-3.72H.96v2.34A9 9 0 0 0 9 18Z" />
      <path fill="#fbbc05" d="M3.96 10.7A5.42 5.42 0 0 1 3.68 9c0-.59.1-1.17.28-1.7V4.96h-3A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3-2.34Z" />
      <path fill="#ea4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.59A8.65 8.65 0 0 0 9 0 9 9 0 0 0 .96 4.96l3 2.34A5.37 5.37 0 0 1 9 3.58Z" />
    </g>
  </svg>
</template>
