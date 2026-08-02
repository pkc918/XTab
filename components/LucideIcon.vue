<script setup lang="ts">
import { iconRegistry, type IconName } from './icons/registry';
import type { IconProps } from './icons/types';

defineOptions({ inheritAttrs: false });

interface LucideIconProps extends IconProps {
  name: IconName;
}

withDefaults(
  defineProps<LucideIconProps>(),
  {
    size: 18,
    color: 'currentColor',
    strokeWidth: 1.7,
    absoluteStrokeWidth: false,
  },
);
</script>

<template>
  <component
    :is="iconRegistry[name]"
    v-bind="{ 'aria-hidden': true, ...$attrs }"
    :size="size"
    :color="color"
    :stroke-width="strokeWidth"
    :absolute-stroke-width="absoluteStrokeWidth"
    focusable="false"
  />
</template>
