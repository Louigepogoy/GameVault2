<script setup>
import { Heart, Library, Play, Trophy } from 'lucide-vue-next';

const props = defineProps({
  stats: { type: Object, default: null },
});

const cards = computed(() => [
  { key: 'total', label: 'Total Games', icon: Library, color: 'var(--accent-soft)' },
  { key: 'favorites', label: 'Favorites', icon: Heart, color: 'var(--red)' },
  { key: 'completed', label: 'Completed', icon: Trophy, color: 'var(--green)' },
  { key: 'playing', label: 'Currently Playing', icon: Play, color: 'var(--blue)' },
].map((c) => ({ ...c, value: props.stats?.[c.key] })));
</script>

<template>
  <section class="stats" aria-label="Collection stats">
    <article v-for="card in cards" :key="card.key" class="card stat" :style="{ '--c': card.color }">
      <div class="stat-icon">
        <component :is="card.icon" :size="22" :stroke-width="2.25" />
      </div>
      <div class="stat-body">
        <span v-if="card.value === undefined" class="skeleton stat-skeleton" aria-hidden="true" />
        <span v-else class="stat-value">{{ card.value }}</span>
        <span class="stat-label">{{ card.label }}</span>
      </div>
    </article>
  </section>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (min-width: 768px) {
  .stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  position: relative;
  overflow: hidden;
}

.stat::after {
  content: '';
  position: absolute;
  top: -40px;
  right: -40px;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: var(--c);
  opacity: 0.1;
  filter: blur(20px);
  pointer-events: none;
}

.stat-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  color: var(--c);
  background: color-mix(in srgb, var(--c) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--c) 35%, transparent);
}

.stat-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-value {
  font-family: var(--font-display);
  font-size: clamp(28px, 7vw, 36px);
  font-weight: 700;
  line-height: 1.1;
}

.stat-skeleton {
  display: block;
  width: 56px;
  height: 36px;
  margin-bottom: 4px;
}

.stat-label {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
