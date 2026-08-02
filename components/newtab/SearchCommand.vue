<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import IconGlyph from '@/components/IconGlyph.vue';

const searchQuery = ref('');
const searchInput = ref<HTMLInputElement | null>(null);
const shortcutLabel = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent) ? '⌘ K' : 'Ctrl K';

function resolveDirectUrl(value: string) {
  if (/^https?:\/\//i.test(value)) {
    try {
      return new URL(value).href;
    } catch {
      return null;
    }
  }

  if (/\s/.test(value)) return null;

  const candidate = value.replace(/^\/\//, '');
  const authority = candidate.split(/[/?#]/, 1)[0];
  const bracketedHost = authority.match(/^\[([^\]]+)](?::(\d+))?$/);
  const regularHost = authority.match(/^([^:]+)(?::(\d+))?$/);

  if (!bracketedHost && !regularHost) return null;

  const hostname = (bracketedHost?.[1] ?? regularHost?.[1] ?? '').toLowerCase();
  const hasPort = Boolean(bracketedHost?.[2] ?? regularHost?.[2]);
  const hasPath = candidate.length > authority.length;
  const isIpv6 = Boolean(bracketedHost && hostname.includes(':'));
  const isIpv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  const isLocalhost = hostname === 'localhost' || hostname.endsWith('.localhost');
  const isLoopback = isLocalhost || hostname === '0.0.0.0' || hostname.startsWith('127.') || hostname === '::1';
  const isDottedHost = hostname.includes('.') && /^[a-z0-9.-]+$/i.test(hostname);
  const isIntranetHost = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(hostname) && (hasPort || hasPath);

  if (!isIpv6 && !isIpv4 && !isLocalhost && !isDottedHost && !isIntranetHost) return null;

  try {
    return new URL(`${isLoopback ? 'http' : 'https'}://${candidate}`).href;
  } catch {
    return null;
  }
}

function submitSearch() {
  const query = searchQuery.value.trim();
  if (!query) {
    searchInput.value?.focus();
    return;
  }

  window.location.href = resolveDirectUrl(query) ?? `https://www.google.com/search?q=${encodeURIComponent(query)}`;
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
    <IconGlyph name="google" :size="20" />
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
    <kbd aria-hidden="true">{{ shortcutLabel }}</kbd>
    <button type="submit" aria-label="开始搜索" title="开始搜索">
      <IconGlyph name="arrow" :size="17" />
    </button>
  </form>
</template>
