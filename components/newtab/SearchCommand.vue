<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';
import { resolveWebUrl } from '@/utils/urls';

const searchQuery = ref('');
const searchInput = ref<HTMLInputElement | null>(null);
const shortcutLabel = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent) ? '⌘ K' : 'Ctrl K';

function submitSearch() {
  const query = searchQuery.value.trim();
  if (!query) {
    searchInput.value?.focus();
    return;
  }

  window.location.href = resolveWebUrl(query) ?? `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function submitAiSearch() {
  const query = searchQuery.value.trim();
  window.location.href = query
    ? `https://www.google.com/search?udm=50&q=${encodeURIComponent(query)}`
    : 'https://www.google.com/ai';
}

function handleGlobalShortcut(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  const isTyping = target?.matches('input, textarea, [contenteditable="true"]');
  const wantsSearch = event.key === '/' || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k');

  if (wantsSearch && !isTyping) {
    event.preventDefault();
    searchInput.value?.focus();
  }
}

onMounted(() => window.addEventListener('keydown', handleGlobalShortcut));
onUnmounted(() => window.removeEventListener('keydown', handleGlobalShortcut));
</script>

<template>
  <form class="search-form" role="search" @submit.prevent="submitSearch">
    <LucideIcon name="google" :size="20" />
    <input
      ref="searchInput"
      v-model="searchQuery"
      type="search"
      name="q"
      autocomplete="off"
      spellcheck="false"
      placeholder="搜索或输入网址"
      aria-label="搜索或输入网址"
      aria-keyshortcuts="Meta+K Control+K /"
    />
    <button
      class="search-ai-mode-button"
      type="button"
      aria-label="使用 Google AI Mode 搜索"
      title="Google AI Mode"
      @click="submitAiSearch"
    >
      <LucideIcon name="sparkles" :size="15" />
      <span>AI Mode</span>
    </button>
    <kbd aria-hidden="true">{{ shortcutLabel }}</kbd>
    <button class="search-submit-button" type="submit" aria-label="开始搜索" title="开始搜索">
      <LucideIcon name="arrow" :size="17" />
    </button>
  </form>
</template>
