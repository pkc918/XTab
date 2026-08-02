<script setup lang="ts">
import IconGlyph from '@/components/IconGlyph.vue';

defineProps<{ message: string }>();
defineEmits<{ (event: 'close'): void }>();
</script>

<template>
  <Transition name="toast">
    <div v-if="message" class="toast" role="status" aria-live="polite" aria-atomic="true">
      <span>{{ message }}</span>
      <button type="button" aria-label="关闭提示" @click="$emit('close')">
        <IconGlyph name="plus" :size="15" />
      </button>
    </div>
  </Transition>
</template>
