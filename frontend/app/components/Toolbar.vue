<script setup>
import { Heart, Plus, Search, X } from 'lucide-vue-next';
import { SORTS, STATUSES } from '~/utils/constants';

const search = defineModel('search', { type: String, default: '' });
const status = defineModel('status', { type: String, default: '' });
const sort = defineModel('sort', { type: String, default: 'newest' });
const favorites = defineModel('favorites', { type: Boolean, default: false });
const emit = defineEmits(['add']);
</script>

<template>
  <section class="toolbar" aria-label="Search, filter and sort">
    <div class="search">
      <Search class="search-icon" :size="18" aria-hidden="true" />
      <label for="search-input" class="sr-only">Search games by title</label>
      <input
        id="search-input"
        v-model="search"
        type="search"
        class="field search-input"
        placeholder="Search games..."
        aria-keyshortcuts="/"
        autocomplete="off"
        enterkeyhint="search"
      />
      <button
        v-if="search"
        type="button"
        class="clear-btn"
        aria-label="Clear search"
        @click="search = ''"
      >
        <X :size="16" />
      </button>
    </div>

    <div class="filters">
      <label for="status-filter" class="sr-only">Filter by status</label>
      <select id="status-filter" v-model="status" class="field">
        <option value="">All Statuses</option>
        <option v-for="s in STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>

      <label for="sort-select" class="sr-only">Sort games</label>
      <select id="sort-select" v-model="sort" class="field">
        <option v-for="s in SORTS" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>

      <button
        type="button"
        class="icon-btn fav-toggle"
        :class="{ active: favorites }"
        :aria-pressed="favorites"
        :aria-label="favorites ? 'Show all games' : 'Show favorites only'"
        :title="favorites ? 'Showing favorites only' : 'Show favorites only'"
        @click="favorites = !favorites"
      >
        <Heart :size="20" :fill="favorites ? 'currentColor' : 'none'" />
      </button>
    </div>

    <button type="button" class="btn btn-primary add-btn" title="Add game (N)" aria-keyshortcuts="N" @click="emit('add')">
      <Plus :size="20" :stroke-width="2.5" />
      Add Game
    </button>
  </section>

  <!-- Floating action button (mobile only) -->
  <button type="button" class="fab" aria-label="Add game" @click="emit('add')">
    <Plus :size="28" :stroke-width="2.5" />
  </button>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search {
  position: relative;
  flex: 1;
  min-width: 0;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  padding-left: 42px;
  padding-right: 44px;
}

.search-input::-webkit-search-cancel-button {
  display: none;
}

.clear-btn {
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: none;
  background: none;
  color: var(--text-muted);
}

.filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 10px;
}

.fav-toggle {
  width: 46px;
  height: 46px;
}

.fav-toggle.active {
  color: var(--red);
  border-color: color-mix(in srgb, var(--red) 45%, transparent);
  background: color-mix(in srgb, var(--red) 12%, transparent);
}

.add-btn {
  display: none;
}

.fab {
  position: fixed;
  right: max(16px, env(safe-area-inset-right));
  bottom: max(20px, env(safe-area-inset-bottom));
  z-index: 40;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  display: grid;
  place-items: center;
  color: #fff;
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  box-shadow: 0 10px 28px rgba(139, 92, 246, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08) inset;
  transition: transform 0.15s ease;
}

.fab:active {
  transform: scale(0.92);
}

@media (min-width: 640px) {
  /* Search takes its own row until there is room for everything on one line. */
  .toolbar {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }

  .search {
    flex: 1 1 280px;
  }

  .filters {
    display: flex;
    flex: 1 0 auto;
  }

  .filters select {
    width: 170px;
    flex: 1 0 auto;
  }

  .add-btn {
    display: inline-flex;
    flex-shrink: 0;
  }

  .fab {
    display: none;
  }
}
</style>
