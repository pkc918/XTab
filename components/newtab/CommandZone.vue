<script setup lang="ts">
import SearchCommand from './SearchCommand.vue';
import QuickLinks from './QuickLinks.vue';
import type { QuickLink } from './types';

defineProps<{ links: QuickLink[] }>();
defineEmits<{
  (event: 'add-link'): void;
  (event: 'remove-link', link: QuickLink): void;
}>();
</script>

<template>
  <section class="command-zone" aria-label="搜索和快捷入口">
    <SearchCommand />
    <QuickLinks
      :links="links"
      @add-link="$emit('add-link')"
      @remove-link="$emit('remove-link', $event)"
    />
  </section>
</template>
