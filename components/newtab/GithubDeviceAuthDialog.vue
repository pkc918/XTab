<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';
import type { GithubDeviceAuthorization } from '@/composables/useGithubAuth';

const props = defineProps<{
  authorization: GithubDeviceAuthorization | null;
}>();

const emit = defineEmits<{
  (event: 'copy-code'): void;
  (event: 'open-github'): void;
  (event: 'cancel'): void;
}>();

const dialog = ref<HTMLElement | null>(null);
const expirationLabel = computed(() => {
  if (!props.authorization) return '';
  const expiration = new Date(props.authorization.expiresAt);
  if (Number.isNaN(expiration.getTime())) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(expiration);
});

watch(
  () => props.authorization,
  async (authorization) => {
    if (!authorization) return;
    await nextTick();
    dialog.value?.focus();
  },
  { immediate: true },
);
</script>

<template>
  <Transition name="github-device-dialog">
    <div v-if="authorization" class="github-device-overlay">
      <section
        ref="dialog"
        class="github-device-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="github-device-title"
        aria-describedby="github-device-description"
        tabindex="-1"
        @keydown.esc.prevent="emit('cancel')"
      >
        <button
          class="github-device-close"
          type="button"
          aria-label="取消 GitHub 登录"
          title="取消登录"
          @click="emit('cancel')"
        >
          <LucideIcon name="plus" :size="17" />
        </button>

        <span class="github-device-icon" aria-hidden="true">
          <LucideIcon name="github" :size="30" />
        </span>
        <h2 id="github-device-title">连接 GitHub</h2>
        <p id="github-device-description">
          这是 GitHub 为本次登录生成的一次性验证码。先复制它，再打开授权页完成确认。
        </p>

        <div class="github-device-code-block">
          <span>一次性验证码</span>
          <code>{{ authorization.userCode }}</code>
          <small v-if="expirationLabel">
            请在 <time :datetime="authorization.expiresAt">{{ expirationLabel }}</time> 前使用
          </small>
        </div>

        <div class="github-device-actions">
          <button class="github-device-copy" type="button" @click="emit('copy-code')">
            复制验证码
          </button>
          <button class="github-device-open" type="button" @click="emit('open-github')">
            <span>打开 GitHub 授权页</span>
            <LucideIcon name="external" :size="16" />
          </button>
        </div>

        <p class="github-device-footnote">
          在 GitHub 页面粘贴此验证码。授权成功后，XTab 会自动完成登录。
        </p>
      </section>
    </div>
  </Transition>
</template>
