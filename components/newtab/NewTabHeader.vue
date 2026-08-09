<script setup lang="ts">
import LucideIcon from '@/components/LucideIcon.vue';
import GithubAuthButton from './GithubAuthButton.vue';
import type { GithubAuthState, GithubUser, Theme } from './types';

defineProps<{
  githubAuthState: GithubAuthState;
  githubUser: GithubUser | null;
}>();

const theme = defineModel<Theme>('theme', { required: true });

const emit = defineEmits<{
  (event: 'open-settings'): void;
  (event: 'connect-github'): void;
}>();

function toggleTheme() {
  const root = document.documentElement;
  root.classList.add('theme-switching');
  theme.value = theme.value === 'light' ? 'dark' : 'light';
  requestAnimationFrame(() => root.classList.remove('theme-switching'));
}
</script>

<template>
  <header class="topbar">
    <a class="brand" href="./newtab.html" aria-label="返回 XTab 新标签页">
      <img class="brand-mark" src="/branding/xtab-logo.svg" alt="" width="26" height="26" />
      <span>XTab</span>
    </a>

    <div class="topbar-actions">
      <button class="icon-button" type="button" aria-label="打开设置" title="设置" @click="$emit('open-settings')">
        <LucideIcon name="settings" />
      </button>
      <button
        class="theme-toggle"
        type="button"
        :aria-pressed="theme === 'dark'"
        :aria-label="theme === 'light' ? '切换到暗色主题' : '切换到亮色主题'"
        :title="theme === 'light' ? '切换到暗色主题' : '切换到亮色主题'"
        @click="toggleTheme"
      >
        <LucideIcon :name="theme === 'light' ? 'sun' : 'moon'" :size="18" />
      </button>
      <GithubAuthButton
        :state="githubAuthState"
        :user="githubUser"
        @connect="$emit('connect-github')"
      />
    </div>
  </header>
</template>
