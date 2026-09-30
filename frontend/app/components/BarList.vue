<script setup>
// Single-series horizontal bars: label, bar, value at the bar's tip.
const props = defineProps({
  // [{ key, label, value, display? }]
  items: { type: Array, required: true },
  empty: { type: String, default: 'No data yet.' },
});

const max = computed(() => Math.max(...props.items.map((i) => i.value), 0));
const width = (value) => (max.value ? `${Math.max((value / max.value) * 100, 2)}%` : '0%');
</script>

<template>
  <ul v-if="items.length" class="bars">
    <li v-for="(item, i) in items" :key="item.key ?? item.label" class="bar-row" :title="`${item.label}: ${item.display ?? item.value}`">
      <span class="bar-label">{{ item.label }}</span>
      <span class="bar-track" aria-hidden="true">
        <Motion
          as="span"
          class="bar"
          :initial="{ width: '0%' }"
          :while-in-view="{ width: width(item.value) }"
          :in-view-options="{ once: true }"
          :transition="{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }"
        />
      </span>
      <span class="bar-value">{{ item.display ?? item.value }}</span>
    </li>
  </ul>
  <p v-else class="bars-empty">{{ empty }}</p>
</template>

<style scoped>
.bars {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bar-row {
  display: grid;
  grid-template-columns: minmax(0, 7.5em) minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 6px 8px;
  margin: 0 -8px;
  border-radius: 8px;
  transition: background-color 0.15s ease;
}

.bar-row:hover {
  background: var(--surface-2);
}

.bar-label {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-track {
  display: block;
  height: 10px;
}

/* Square at the baseline, 4px rounded at the data end. */
.bar {
  display: block;
  height: 100%;
  border-radius: 0 4px 4px 0;
  background: var(--chart-bar);
}

.bar-value {
  min-width: 2.5ch;
  text-align: right;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.bars-empty {
  margin: 0;
  color: var(--text-muted);
}
</style>
