<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';
import type { QuickLink } from './types';

const props = defineProps<{
  link: QuickLink | null;
  busy: boolean;
}>();

const emit = defineEmits<{
  (event: 'confirm'): void;
  (event: 'cancel'): void;
}>();

const dialog = ref<HTMLElement | null>(null);
const cancelButton = ref<HTMLButtonElement | null>(null);
let previousFocus: HTMLElement | null = null;

const hostname = computed(() => {
  if (!props.link) return '';
  try {
    return new URL(props.link.href).hostname.replace(/^www\./i, '');
  } catch {
    return props.link.href;
  }
});

function cancel() {
  if (!props.busy) emit('cancel');
}

function handleDialogKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    cancel();
    return;
  }

  if (event.key !== 'Tab' || !dialog.value) return;
  const focusable = [...dialog.value.querySelectorAll<HTMLElement>('button, [tabindex]:not([tabindex="-1"])')]
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
  () => props.link,
  async (link) => {
    if (link) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      await nextTick();
      cancelButton.value?.focus();
      return;
    }

    await nextTick();
    if (previousFocus?.isConnected) previousFocus.focus();
    previousFocus = null;
  },
);
</script>

<template>
  <Transition name="quick-link-dialog">
    <div v-if="link" class="quick-link-overlay" @click.self="cancel">
      <section
        ref="dialog"
        class="quick-link-dialog quick-link-delete-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="quick-link-delete-title"
        aria-describedby="quick-link-delete-description"
        :aria-busy="busy"
        @keydown="handleDialogKeydown"
      >
        <button
          class="quick-link-dialog-close"
          type="button"
          aria-label="取消删除快捷网站"
          title="取消删除"
          :disabled="busy"
          @click="cancel"
        >
          <LucideIcon name="plus" :size="17" />
        </button>

        <span class="quick-link-dialog-icon quick-link-delete-dialog-icon" aria-hidden="true">
          <LucideIcon name="trash" :size="24" />
        </span>
        <h2 id="quick-link-delete-title">删除快捷网站？</h2>
        <p id="quick-link-delete-description">
          「{{ link.name }}」将从快捷入口中移除。你仍可稍后重新添加 {{ hostname }}。
        </p>

        <div class="quick-link-form-actions quick-link-delete-actions">
          <button ref="cancelButton" type="button" :disabled="busy" @click="cancel">取消</button>
          <button
            class="quick-link-delete-confirm"
            type="button"
            :disabled="busy"
            @click="emit('confirm')"
          >
            {{ busy ? '删除中…' : '确认删除' }}
          </button>
        </div>
      </section>
    </div>
  </Transition>
</template>
