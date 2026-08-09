<script setup lang="ts">
import { nextTick } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';
import GithubAuthButton from './GithubAuthButton.vue';
import type { GithubAuthState, GithubUser, Theme } from './types';

const props = defineProps<{
  theme: Theme;
  githubAuthState: GithubAuthState;
  githubUser: GithubUser | null;
}>();

const emit = defineEmits<{
  (event: 'toggle-theme'): void;
  (event: 'open-settings'): void;
  (event: 'connect-github'): void;
}>();

function toggleTheme(event: MouseEvent) {
  // @ts-expect-error View Transition is available only in supporting browsers.
  const isAppearanceTransition = document.startViewTransition
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!isAppearanceTransition) {
    emit('toggle-theme');
    return;
  }

  const target = event.currentTarget as HTMLElement;
  const themeIcon = target.querySelector('svg') ?? target;
  const targetRect = themeIcon.getBoundingClientRect();
  const x = targetRect.left + targetRect.width / 2;
  const y = targetRect.top + targetRect.height / 2;
  const switchingToDark = props.theme === 'light';
  const root = document.documentElement;
  const endRadius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y),
  );
  const transition = document.startViewTransition(async () => {
    root.classList.add('theme-transition-snapshot');
    void root.offsetWidth;
    emit('toggle-theme');
    await nextTick();
  });
  void transition.ready.then(() => {
    root.classList.remove('theme-transition-snapshot');
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`,
    ];
    root.animate(
      {
        clipPath: switchingToDark
          ? [...clipPath].reverse()
          : clipPath,
      },
      {
        duration: 400,
        easing: 'ease-out',
        fill: 'forwards',
        pseudoElement: switchingToDark
          ? '::view-transition-old(root)'
          : '::view-transition-new(root)',
      },
    );
  }, () => {
    root.classList.remove('theme-transition-snapshot');
  });
  void transition.finished.then(
    () => root.classList.remove('theme-transition-snapshot'),
    () => root.classList.remove('theme-transition-snapshot'),
  );
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
