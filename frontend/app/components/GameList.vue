<script setup>
defineProps({
  games: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  // True when no search/filter is active, so an empty list means an empty vault.
  unfiltered: { type: Boolean, default: false },
});
defineEmits(['toggle-favorite', 'edit', 'delete', 'add', 'clear-filters']);

// Stagger the cards only on first load; later changes (sort, filter) just glide into place.
const firstLoad = ref(true);
onMounted(() => setTimeout(() => (firstLoad.value = false), 800));
</script>

<template>
  <section aria-label="Games" :aria-busy="loading">
    <!-- First load: skeleton cards -->
    <div v-if="loading && !games.length" class="grid">
      <div v-for="n in 4" :key="n" class="card skeleton-card" aria-hidden="true">
        <div class="skeleton sk-cover" />
        <div class="sk-lines">
          <div class="skeleton sk-line" style="width: 70%" />
          <div class="skeleton sk-line" style="width: 45%" />
          <div class="skeleton sk-line" style="width: 55%" />
          <div class="sk-buttons">
            <div v-for="b in 3" :key="b" class="skeleton sk-btn" />
          </div>
        </div>
      </div>
    </div>

    <EmptyState
      v-else-if="!games.length && unfiltered"
      title="Your vault is empty."
      message="Add your first game to get started."
    >
      <div class="empty-actions">
        <button type="button" class="btn btn-primary" @click="$emit('add')">+ Add Game</button>
        <NuxtLink to="/discover" class="btn btn-ghost">Discover Games</NuxtLink>
      </div>
    </EmptyState>

    <EmptyState v-else-if="!games.length" title="No games match." message="Try a different search or filter.">
      <button type="button" class="btn btn-ghost" @click="$emit('clear-filters')">Clear filters</button>
    </EmptyState>

    <div v-else class="grid" :class="{ refreshing: loading }">
      <AnimatePresence mode="popLayout">
        <Motion
          v-for="(game, i) in games"
          :key="game.id"
          layout
          class="grid-item"
          :initial="{ opacity: 0, y: 18, scale: 0.98 }"
          :animate="{ opacity: 1, y: 0, scale: 1 }"
          :exit="{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }"
          :transition="{ type: 'spring', stiffness: 320, damping: 30, delay: firstLoad ? Math.min(i, 8) * 0.05 : 0 }"
        >
          <GameCard
            :game="game"
            @toggle-favorite="$emit('toggle-favorite', $event)"
            @edit="$emit('edit', $event)"
            @delete="$emit('delete', $event)"
          />
        </Motion>
      </AnimatePresence>
    </div>
  </section>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  transition: opacity 0.2s ease;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
}

.empty-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.refreshing {
  opacity: 0.55;
}

.skeleton-card {
  display: flex;
  gap: 14px;
  padding: 12px;
}

.sk-cover {
  width: 92px;
  aspect-ratio: 3 / 4;
  border-radius: 12px;
  flex-shrink: 0;
}

.sk-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
}

.sk-line {
  height: 14px;
}

.sk-buttons {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.sk-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
}

.grid-item {
  display: flex;
  min-width: 0;
}

.grid-item > * {
  flex: 1;
}
</style>
