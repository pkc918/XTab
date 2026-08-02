<script setup lang="ts">
import IconGlyph from '@/components/IconGlyph.vue';
import type { GithubAuthState, GithubUser } from './types';

defineProps<{
  state: GithubAuthState;
  user: GithubUser | null;
}>();

defineEmits<{ (event: 'connect'): void }>();
</script>

<template>
  <a
    v-if="user"
    class="github-account-button"
    :href="user.profileUrl"
    :aria-label="`打开 ${user.login} 的 GitHub 主页`"
    :title="`@${user.login}`"
  >
    <img :src="user.avatarUrl" alt="" width="44" height="44" />
  </a>

  <button
    v-else
    class="github-login-button"
    type="button"
    :disabled="state === 'authorizing'"
    :aria-busy="state === 'authorizing'"
    :aria-label="state === 'authorizing' ? '正在等待 GitHub 授权' : '登录 GitHub'"
    :title="state === 'authorizing' ? '等待 GitHub 授权' : '登录 GitHub'"
    @click="$emit('connect')"
  >
    <span v-if="state === 'authorizing'" class="github-auth-spinner" aria-hidden="true"></span>
    <IconGlyph v-else name="github" :size="23" />
  </button>
</template>
