<script setup lang="ts">
import SearchCommand from './SearchCommand.vue';
import QuickLinks from './QuickLinks.vue';
import type { QuickLink } from './types';

defineProps<{ links: QuickLink[] }>();
defineEmits<{ (event: 'open-settings'): void }>();
</script>

<template>
  <section class="command-zone" aria-label="搜索和快捷入口">
    <SearchCommand />
    <QuickLinks :links="links" @open-settings="$emit('open-settings')" />
  </section>
</template>
