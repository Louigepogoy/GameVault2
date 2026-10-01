<script setup>
import { Check } from 'lucide-vue-next';

// Multi-select chips (toggle buttons). v-model is an array of selected values.
const model = defineModel({ type: Array, default: () => [] });
defineProps({
  options: { type: Array, required: true }, // [{ value, label }] or plain strings
  label: { type: String, required: true }, // read by screen readers for the group
});

const valueOf = (o) => (typeof o === 'string' ? o : o.value);
const labelOf = (o) => (typeof o === 'string' ? o : o.label);

function toggle(value) {
  model.value = model.value.includes(value)
    ? model.value.filter((v) => v !== value)
    : [...model.value, value];
}
</script>

<template>
  <div class="chips" role="group" :aria-label="label">
    <button
      v-for="o in options"
      :key="valueOf(o)"
      type="button"
      class="chip"
      :class="{ on: model.includes(valueOf(o)) }"
      :aria-pressed="model.includes(valueOf(o))"
      @click="toggle(valueOf(o))"
    >
      <Check v-if="model.includes(valueOf(o))" :size="16" :stroke-width="3" aria-hidden="true" />
      {{ labelOf(o) }}
    </button>
  </div>
</template>

<style scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  font-weight: 700;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    transform 0.1s ease;
}

.chip:hover {
  border-color: var(--border-strong);
}

.chip:active {
  transform: scale(0.96);
}

.chip.on {
  color: #fff;
  border-color: transparent;
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
}
</style>
