<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import CommandZone from '@/components/newtab/CommandZone.vue';
import GithubProfilePanel from '@/components/newtab/GithubProfilePanel.vue';
import NewTabHeader from '@/components/newtab/NewTabHeader.vue';
import RepositoryPanel from '@/components/newtab/RepositoryPanel.vue';
import RssPanel from '@/components/newtab/RssPanel.vue';
import ToastNotice from '@/components/newtab/ToastNotice.vue';
import type { Theme } from '@/components/newtab/types';
import { useGithubAuth } from '@/composables/useGithubAuth';
import { contributionLevels, quickLinks, repositories, rssItems } from './data';

function getInitialTheme(): Theme {
  try {
    const storedTheme = localStorage.getItem('xtab-theme');
    if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;
  } catch {
    // Theme persistence can be unavailable in restricted extension contexts.
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const theme = ref<Theme>(getInitialTheme());
const notice = ref('');
let noticeTimer: ReturnType<typeof setTimeout> | undefined;

document.documentElement.dataset.theme = theme.value;

function setTheme(nextTheme: Theme) {
  theme.value = nextTheme;
  document.documentElement.dataset.theme = nextTheme;
}

function toggleTheme() {
  setTheme(theme.value === 'light' ? 'dark' : 'light');
}

function showNotice(message: string, duration = 3600) {
  notice.value = message;
  if (noticeTimer) clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    notice.value = '';
  }, duration);
}

const { githubUser, githubAuthState, connectGithub } = useGithubAuth(showNotice);

function openSettings() {
  showNotice('设置与快捷入口配置将在数据层接入后开放。');
}

watch(theme, (nextTheme) => {
  try {
    localStorage.setItem('xtab-theme', nextTheme);
  } catch {
    // The active theme still works for this tab when persistence is unavailable.
  }
});

onUnmounted(() => {
  if (noticeTimer) clearTimeout(noticeTimer);
});
</script>

<template>
  <div class="app-shell">
    <NewTabHeader
      :theme="theme"
      :github-auth-state="githubAuthState"
      :github-user="githubUser"
      @toggle-theme="toggleTheme"
      @open-settings="openSettings"
      @connect-github="connectGithub"
    />

    <main>
      <CommandZone :links="quickLinks" @open-settings="openSettings" />

      <section class="dashboard" aria-label="XTab 信息工作台">
        <RssPanel :items="rssItems" @notify="showNotice" @open-settings="openSettings" />
        <RepositoryPanel :repositories="repositories" />
        <GithubProfilePanel
          :contribution-levels="contributionLevels"
          :github-auth-state="githubAuthState"
          :github-user="githubUser"
          @connect-github="connectGithub"
        />
      </section>
    </main>

    <ToastNotice :message="notice" @close="notice = ''" />
  </div>
</template>
