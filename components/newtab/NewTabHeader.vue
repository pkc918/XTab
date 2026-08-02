<script setup lang="ts">
import IconGlyph from '@/components/IconGlyph.vue';
import GithubAuthButton from './GithubAuthButton.vue';
import type { GithubAuthState, GithubUser, Theme } from './types';

defineProps<{
  theme: Theme;
  githubAuthState: GithubAuthState;
  githubUser: GithubUser | null;
}>();

defineEmits<{
  (event: 'toggle-theme'): void;
  (event: 'open-settings'): void;
  (event: 'connect-github'): void;
}>();
</script>

<template>
  <header class="topbar">
    <a class="brand" href="./newtab.html" aria-label="返回 XTab 新标签页">
      <svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M3 5h8l6 8-5 6L3 5Z" />
        <path d="M21 5h8L18 20l-5-6L21 5Z" />
        <path d="M13 20l5-6 11 13h-8l-8-7Z" />
        <path d="M12 19l5 6-2 2H3l9-8Z" />
      </svg>
      <span>XTab</span>
    </a>

    <div class="topbar-actions">
      <button class="icon-button" type="button" aria-label="打开设置" title="设置" @click="$emit('open-settings')">
        <IconGlyph name="settings" />
      </button>
      <button
        class="theme-toggle"
        type="button"
        :aria-pressed="theme === 'dark'"
        :aria-label="theme === 'light' ? '切换到暗色主题' : '切换到亮色主题'"
        :title="theme === 'light' ? '切换到暗色主题' : '切换到亮色主题'"
        @click="$emit('toggle-theme')"
      >
        <IconGlyph :name="theme === 'light' ? 'sun' : 'moon'" :size="18" />
      </button>
      <GithubAuthButton
        :state="githubAuthState"
        :user="githubUser"
        @connect="$emit('connect-github')"
      />
    </div>
  </header>
</template>
