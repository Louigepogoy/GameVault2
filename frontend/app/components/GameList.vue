<script setup>
defineProps({
  games: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  // True when no search/filter is active, so an empty list means an empty vault.
  unfiltered: { type: Boolean, default: false },
});
defineEmits(['toggle-favorite', 'edit', 'delete', 'add']);
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

    <EmptyState v-else-if="!games.length" />

    <TransitionGroup v-else tag="div" name="list" class="grid" :class="{ refreshing: loading }">
      <GameCard
        v-for="game in games"
        :key="game.id"
        :game="game"
        @toggle-favorite="$emit('toggle-favorite', $event)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
    </TransitionGroup>
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

.list-enter-active,
.list-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

.list-leave-active {
  position: absolute;
  visibility: hidden;
}

.list-move {
  transition: transform 0.3s ease;
}
</style>
