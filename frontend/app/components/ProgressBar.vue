<script setup>
const props = defineProps({
  completed: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
});

const percent = computed(() => (props.total ? Math.round((props.completed / props.total) * 100) : 0));
</script>

<template>
  <section class="card progress">
    <div class="progress-head">
      <h2 id="progress-title">Collection Progress</h2>
      <span class="progress-percent">{{ percent }}%</span>
    </div>
    <div
      class="track"
      role="progressbar"
      aria-labelledby="progress-title"
      :aria-valuenow="percent"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="fill" :style="{ width: `${percent}%` }" />
    </div>
    <p class="progress-caption">{{ completed }} of {{ total }} games completed</p>
  </section>
</template>

<style scoped>
.progress {
  padding: 16px 18px;
}

.progress-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.progress-percent {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--accent-soft);
}

.track {
  height: 12px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #6d28d9, #8b5cf6, #c084fc);
  box-shadow: 0 0 14px rgba(139, 92, 246, 0.7);
  transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.progress-caption {
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 15px;
  font-weight: 500;
}
</style>
