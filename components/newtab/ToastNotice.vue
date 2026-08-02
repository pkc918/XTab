<script setup lang="ts">
import LucideIcon from '@/components/LucideIcon.vue';

defineProps<{ message: string }>();
defineEmits<{ (event: 'close'): void }>();
</script>

<template>
  <Transition name="toast">
    <div v-if="message" class="toast" role="status" aria-live="polite" aria-atomic="true">
      <span>{{ message }}</span>
      <button type="button" aria-label="关闭提示" @click="$emit('close')">
        <LucideIcon name="plus" :size="15" />
      </button>
    </div>
  </Transition>
</template>
