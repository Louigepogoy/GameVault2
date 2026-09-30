<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Are you sure?' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Delete' },
  busy: { type: Boolean, default: false },
});
const emit = defineEmits(['confirm', 'cancel']);
</script>

<template>
  <BaseSheet :open="open" :title="title" size="sm" @close="emit('cancel')">
    <p class="message">{{ message }}</p>
    <div class="actions">
      <button type="button" class="btn btn-ghost" autofocus @click="emit('cancel')">Cancel</button>
      <button type="button" class="btn btn-danger" :disabled="busy" @click="emit('confirm')">
        {{ busy ? 'Deleting...' : confirmLabel }}
      </button>
    </div>
  </BaseSheet>
</template>

<style scoped>
.message {
  margin: 0 0 18px;
  color: var(--text-muted);
  font-size: 17px;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
</style>
