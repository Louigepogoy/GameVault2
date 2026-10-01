<script setup>
import { ArrowLeft, Search, Sparkles, X } from 'lucide-vue-next';
import { pickLaunch } from '~/utils/launch';

useHead({ title: 'Discover · GameVault' });

const api = useApi();
const toast = useToast();

const { data, error, status } = await useAsyncData('discover', () => api.getDiscover(), {
  default: () => ({ games: [], recommended: [] }),
});
watch(error, (err) => err && toast.error(err.message));
onMounted(() => error.value && toast.error(error.value.message));

const loading = computed(() => status.value === 'pending' && !data.value.games.length);

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'free', label: 'Free to play' },
  { value: 'paid', label: 'Paid' },
  { value: 'pc', label: 'PC' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'console', label: 'Console' },
];
const MOBILE = ['Android', 'iOS'];
const isConsole = (p) => /PlayStation|Xbox|Nintendo/.test(p);

const search = ref('');
// Start on the filter that matches the platforms picked in onboarding/settings.
const { user } = useAuth();
function defaultFilter(prefs = []) {
  if (!prefs.length) return '';
  if (prefs.every((p) => p === 'Mobile')) return 'mobile';
  if (prefs.every((p) => p === 'PC')) return 'pc';
  if (prefs.every((p) => ['PlayStation', 'Xbox', 'Switch'].includes(p))) return 'console';
  return '';
}
const filter = ref(defaultFilter(user.value?.favorite_platforms));
const genre = ref('');

const genres = computed(() => [...new Set(data.value.games.map((g) => g.genre))].sort());

const recommended = computed(() =>
  data.value.recommended.map((slug) => data.value.games.find((g) => g.slug === slug)).filter(Boolean),
);

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return data.value.games.filter((g) => {
    if (q && !`${g.title} ${g.genre} ${g.developer} ${g.tags.join(' ')}`.toLowerCase().includes(q))
      return false;
    if (genre.value && g.genre !== genre.value && !g.tags.includes(genre.value)) return false;
    switch (filter.value) {
      case 'free':
        return g.price === 'free';
      case 'paid':
        return g.price === 'paid';
      case 'pc':
        return g.platforms.includes('PC');
      case 'mobile':
        return g.platforms.some((p) => MOBILE.includes(p));
      case 'console':
        return g.platforms.some(isConsole);
      default:
        return true;
    }
  });
});

const showRecommended = computed(
  () => recommended.value.length && !search.value && !filter.value && !genre.value,
);

function clearFilters() {
  search.value = '';
  filter.value = '';
  genre.value = '';
}

// Details sheet
const selected = ref(null);
const sheetOpen = ref(false);
function openGame(game) {
  selected.value = game;
  sheetOpen.value = true;
}

// Add to vault (as Backlog)
const addingSlug = ref(null);
async function addToVault(game, platform = game.platforms[0]) {
  addingSlug.value = game.slug;
  try {
    await api.createGame({
      title: game.title,
      platform,
      genre: game.genre,
      status: 'backlog',
      cover_url: game.cover_url,
      // Steam link for PC, Android link for phones (Start playing opens the game).
      launch_url: pickLaunch(game.launch, platform),
      notes: game.summary,
    });
    // useAsyncData data is shallow, so swap in new objects instead of mutating.
    const updated = { ...game, in_vault: true };
    data.value = { ...data.value, games: data.value.games.map((g) => (g.slug === game.slug ? updated : g)) };
    if (selected.value?.slug === game.slug) selected.value = updated;
    toast.success(`"${game.title}" added to your backlog`);
  } catch (err) {
    toast.error(err.message);
  } finally {
    addingSlug.value = null;
  }
}
</script>

<template>
  <div class="page">
    <div class="app">
      <header class="header">
        <NuxtLink to="/" class="icon-btn" aria-label="Back to your games">
          <ArrowLeft :size="20" />
        </NuxtLink>
        <div class="heading">
          <h1 class="page-title">Discover</h1>
          <p class="page-sub">Game suggestions, what they're about, and where to get them</p>
        </div>
        <ThemeToggle />
      </header>

      <main class="main">
        <!-- Loading skeleton -->
        <div v-if="loading" class="grid" aria-hidden="true">
          <div v-for="n in 6" :key="n" class="card sk-card">
            <div class="skeleton sk-art" />
            <div class="skeleton sk-line" style="width: 60%" />
            <div class="skeleton sk-line" style="width: 85%" />
          </div>
        </div>

        <template v-else>
          <!-- Recommended for you -->
          <section v-if="showRecommended" aria-labelledby="rec-title">
            <h2 id="rec-title" class="section-title">
              <Sparkles :size="20" aria-hidden="true" />
              Recommended for you
            </h2>
            <p class="section-sub">Based on the genres you play and rate highly</p>
            <div class="grid">
              <DiscoverCard
                v-for="g in recommended"
                :key="`rec-${g.slug}`"
                :game="g"
                :adding="addingSlug === g.slug"
                @open="openGame"
                @add="addToVault"
              />
            </div>
          </section>

          <!-- All games + filters -->
          <section aria-labelledby="all-title">
            <h2 id="all-title" class="section-title">
              {{ showRecommended ? 'More games to try' : 'Game suggestions' }}
            </h2>

            <div class="filters">
              <div class="search">
                <Search class="search-icon" :size="18" aria-hidden="true" />
                <label for="discover-search" class="sr-only">Search suggestions</label>
                <input
                  id="discover-search"
                  v-model="search"
                  type="search"
                  class="field search-input"
                  placeholder="Search games, genres, developers..."
                  autocomplete="off"
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
              <label for="discover-genre" class="sr-only">Genre</label>
              <select id="discover-genre" v-model="genre" class="field genre-select">
                <option value="">All Genres</option>
                <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
              </select>
            </div>

            <div class="chips" role="group" aria-label="Filter suggestions">
              <button
                v-for="f in FILTERS"
                :key="f.value"
                type="button"
                class="chip"
                :class="{ active: filter === f.value }"
                :aria-pressed="filter === f.value"
                @click="filter = f.value"
              >
                {{ f.label }}
              </button>
            </div>

            <div v-if="filtered.length" class="grid">
              <DiscoverCard
                v-for="g in filtered"
                :key="g.slug"
                :game="g"
                :adding="addingSlug === g.slug"
                @open="openGame"
                @add="addToVault"
              />
            </div>
            <EmptyState v-else title="No games match." message="Try another search or filter.">
              <button type="button" class="btn btn-ghost" @click="clearFilters">Clear filters</button>
            </EmptyState>
          </section>
        </template>
      </main>
    </div>

    <DiscoverSheet
      :open="sheetOpen"
      :game="selected"
      :adding="!!selected && addingSlug === selected.slug"
      @close="sheetOpen = false"
      @add="addToVault"
    />
  </div>
</template>

<style scoped>
.app {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) 48px
    max(16px, env(safe-area-inset-left));
}

@media (min-width: 640px) {
  .app {
    padding: 32px 24px 48px;
  }
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.heading {
  flex: 1;
  min-width: 0;
}

.page-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(22px, 6vw, 30px);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--accent-soft);
}

.page-sub {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 15px;
}

.main {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: -0.01em;
}

.section-title svg {
  color: var(--amber);
}

.section-sub {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-weight: 500;
}

.grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  margin-top: 14px;
}

@media (min-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
}

@media (min-width: 960px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* Filters */
.filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
}

@media (min-width: 640px) {
  .filters {
    flex-direction: row;
  }

  .genre-select {
    width: 200px;
    flex-shrink: 0;
  }
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

.chips {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 2px;
}

.chips::-webkit-scrollbar {
  display: none;
}

.chip {
  flex-shrink: 0;
  min-height: 38px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  font-weight: 700;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.chip:hover {
  border-color: var(--border-strong);
}

.chip.active {
  color: #fff;
  border-color: transparent;
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
}

/* Skeleton */
.sk-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 16px;
  overflow: hidden;
}

.sk-art {
  aspect-ratio: 460 / 215;
  border-radius: 0;
}

.sk-line {
  height: 14px;
  margin: 0 16px;
}
</style>
