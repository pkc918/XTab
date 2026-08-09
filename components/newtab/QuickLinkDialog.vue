<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';
import type { QuickLink } from './types';
import { resolveWebUrl, websiteNameFromUrl, webUrlKey } from '@/utils/urls';

const props = defineProps<{
  open: boolean;
  existingLinks: QuickLink[];
}>();

const emit = defineEmits<{
  (event: 'add', value: { name: string; href: string }): void;
  (event: 'close'): void;
}>();

const dialog = ref<HTMLElement | null>(null);
const urlInput = ref<HTMLInputElement | null>(null);
const name = ref('');
const url = ref('');
const errorMessage = ref('');
let previousFocus: HTMLElement | null = null;

function closeDialog() {
  emit('close');
}

function submitLink() {
  errorMessage.value = '';
  const href = resolveWebUrl(url.value);
  if (!href) {
    errorMessage.value = '请输入有效的网站地址，例如 https://example.com。';
    urlInput.value?.focus();
    return;
  }

  const key = webUrlKey(href);
  const isDuplicate = props.existingLinks.some((link) => webUrlKey(link.href) === key);
  if (isDuplicate) {
    errorMessage.value = '这个网站已经在快捷入口中。';
    urlInput.value?.focus();
    return;
  }

  const normalizedName = name.value.trim() || websiteNameFromUrl(href);
  emit('add', { name: normalizedName, href });
}

function handleDialogKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeDialog();
    return;
  }

  if (event.key !== 'Tab' || !dialog.value) return;
  const focusable = [...dialog.value.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hasAttribute('disabled'));
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      name.value = '';
      url.value = '';
      errorMessage.value = '';
      await nextTick();
      urlInput.value?.focus();
      return;
    }

    await nextTick();
    previousFocus?.focus();
    previousFocus = null;
  },
);
</script>

<template>
  <Transition name="quick-link-dialog">
    <div v-if="open" class="quick-link-overlay" @click.self="closeDialog">
      <section
        ref="dialog"
        class="quick-link-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-link-dialog-title"
        aria-describedby="quick-link-dialog-description"
        @keydown="handleDialogKeydown"
      >
        <button
          class="quick-link-dialog-close"
          type="button"
          aria-label="关闭添加网站对话框"
          title="关闭"
          @click="closeDialog"
        >
          <LucideIcon name="plus" :size="17" />
        </button>

        <span class="quick-link-dialog-icon" aria-hidden="true">
          <LucideIcon name="globe" :size="26" />
        </span>
        <h2 id="quick-link-dialog-title">添加快捷网站</h2>
        <p id="quick-link-dialog-description">保存后会显示在搜索框下方，并同步保留在浏览器中。</p>

        <form class="quick-link-form" novalidate @submit.prevent="submitLink">
          <label for="quick-link-url">网站地址</label>
          <input
            id="quick-link-url"
            ref="urlInput"
            v-model="url"
            type="url"
            inputmode="url"
            autocomplete="url"
            maxlength="2048"
            placeholder="example.com"
            :aria-invalid="Boolean(errorMessage)"
            aria-describedby="quick-link-feedback"
            @input="errorMessage = ''"
          />

          <label for="quick-link-name">显示名称 <span>可选</span></label>
          <input
            id="quick-link-name"
            v-model="name"
            type="text"
            autocomplete="off"
            maxlength="40"
            placeholder="未填写时使用网站域名"
            @input="errorMessage = ''"
          />

          <p
            id="quick-link-feedback"
            class="quick-link-feedback"
            :class="{ 'quick-link-feedback--error': errorMessage }"
            aria-live="polite"
          >
            {{ errorMessage || '支持 http、https、本地域名和带端口的开发地址。' }}
          </p>

          <div class="quick-link-form-actions">
            <button type="button" @click="closeDialog">取消</button>
            <button type="submit">添加网站</button>
          </div>
        </form>
      </section>
    </div>
  </Transition>
</template>
