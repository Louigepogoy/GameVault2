<script setup>
import { BarChart3, ChevronRight, Compass, Dices, Gamepad2, LogOut } from 'lucide-vue-next';
import { SORT_VALUES } from '~/utils/constants';

const api = useApi();
const { user, logout } = useAuth();
const toast = useToast();
const route = useRoute();
const router = useRouter();

// Filters live in the URL (?q=&status=&sort=&fav=1) so results are shareable and survive reloads.
const search = ref(typeof route.query.q === 'string' ? route.query.q : '');
const status = ref(typeof route.query.status === 'string' ? route.query.status : '');
const sort = ref(SORT_VALUES.includes(route.query.sort) ? route.query.sort : 'newest');
const favorites = ref(route.query.fav === '1');
const debouncedSearch = ref(search.value.trim());

let searchTimer;
watch(search, (value) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => (debouncedSearch.value = value.trim()), 300);
});

watch([debouncedSearch, status, sort, favorites], ([q, s, o, f]) => {
  router.replace({
    query: { ...(q && { q }), ...(s && { status: s }), ...(o !== 'newest' && { sort: o }), ...(f && { fav: '1' }) },
  });
});

const {
  data: games,
  status: gamesStatus,
  error: gamesError,
  refresh: refreshGames,
} = await useAsyncData(
  'games',
  () =>
    api.listGames({ q: debouncedSearch.value, status: status.value, sort: sort.value, favorite: favorites.value }),
  { watch: [debouncedSearch, status, sort, favorites], default: () => [] },
);

const {
  data: stats,
  error: statsError,
  refresh: refreshStats,
} = await useAsyncData('stats', () => api.getStats(), { default: () => null });

const loading = computed(() => gamesStatus.value === 'pending');
const unfiltered = computed(() => !search.value.trim() && !status.value && !favorites.value);

// Surface fetch errors (including ones from the server render) as toasts.
const reportError = (err) => err && toast.error(err.message || 'Something went wrong');
watch(gamesError, reportError);
watch(statsError, reportError);
onMounted(() => reportError(gamesError.value || statsError.value));

const formOpen = ref(false);
const editingGame = ref(null);
const saving = ref(false);

const pickerOpen = ref(false);

function onStarted() {
  pickerOpen.value = false;
  refreshGames();
  refreshStats();
}

const pendingDelete = ref(null);
const deleting = ref(false);

function openAdd() {
  editingGame.value = null;
  formOpen.value = true;
}

function openEdit(game) {
  editingGame.value = game;
  formOpen.value = true;
}

function closeForm() {
  if (!saving.value) formOpen.value = false;
}

async function saveGame(payload) {
  saving.value = true;
  try {
    if (editingGame.value) {
      const updated = await api.updateGame(editingGame.value.id, payload);
      games.value = games.value.map((g) => (g.id === updated.id ? updated : g));
      toast.success(`"${updated.title}" updated`);
    } else {
      const created = await api.createGame(payload);
      toast.success(`"${created.title}" added to your vault`);
    }
    formOpen.value = false;
    // Refetch so the list respects the active search/filter.
    refreshGames();
    refreshStats();
  } catch (err) {
    toast.error(err.message);
  } finally {
    saving.value = false;
  }
}

async function toggleFavorite(game) {
  const favorite = !game.favorite;
  game.favorite = favorite; // optimistic
  try {
    await api.updateGame(game.id, { favorite });
    toast.success(favorite ? `Added "${game.title}" to favorites` : `Removed "${game.title}" from favorites`);
    if (favorites.value) refreshGames(); // drop it from the favorites-only list
    refreshStats();
  } catch (err) {
    game.favorite = !favorite;
    toast.error(err.message);
  }
}

async function confirmDelete() {
  const game = pendingDelete.value;
  if (!game) return;
  deleting.value = true;
  try {
    await api.deleteGame(game.id);
    games.value = games.value.filter((g) => g.id !== game.id);
    toast.success(`"${game.title}" deleted`);
    pendingDelete.value = null;
    refreshStats();
  } catch (err) {
    toast.error(err.message);
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="brand">
        <div class="logo-icon">
          <Gamepad2 :size="28" :stroke-width="2.25" />
        </div>
        <div>
          <h1 class="logo">GameVault</h1>
          <p class="subtitle">Manage your gaming collection</p>
        </div>
      </div>
      <div class="header-actions">
        <span v-if="user" class="user-name">{{ user.name }}</span>
        <ThemeToggle />
        <button type="button" class="icon-btn" aria-label="Log out" title="Log out" @click="logout">
          <LogOut :size="20" />
        </button>
      </div>
    </header>

    <main class="main">
      <StatsCards :stats="stats" />
      <ProgressBar :completed="stats?.completed ?? 0" :total="stats?.total ?? 0" />

      <nav class="quick-actions" aria-label="Quick actions">
        <NuxtLink to="/discover" class="card quick" style="--c: var(--green)">
          <span class="quick-icon"><Compass :size="22" /></span>
          <span class="quick-text">
            <strong>Discover games</strong>
            <span>Suggestions with download links</span>
          </span>
          <ChevronRight class="quick-arrow" :size="20" aria-hidden="true" />
        </NuxtLink>
        <button v-if="stats?.total" type="button" class="card quick" style="--c: var(--amber)" @click="pickerOpen = true">
          <span class="quick-icon"><Dices :size="22" /></span>
          <span class="quick-text">
            <strong>What should I play next?</strong>
            <span>{{ stats.backlog ? `Pick from ${stats.backlog} backlog game${stats.backlog === 1 ? '' : 's'}` : 'Random pick from your backlog' }}</span>
          </span>
          <ChevronRight class="quick-arrow" :size="20" aria-hidden="true" />
        </button>
        <NuxtLink v-if="stats?.total" to="/insights" class="card quick" style="--c: var(--accent-soft)">
          <span class="quick-icon"><BarChart3 :size="22" /></span>
          <span class="quick-text">
            <strong>Insights</strong>
            <span>Hours played, top genres & more</span>
          </span>
          <ChevronRight class="quick-arrow" :size="20" aria-hidden="true" />
        </NuxtLink>
      </nav>

      <Toolbar
        v-model:search="search"
        v-model:status="status"
        v-model:sort="sort"
        v-model:favorites="favorites"
        @add="openAdd"
      />
      <GameList
        :games="games"
        :loading="loading"
        :unfiltered="unfiltered"
        @toggle-favorite="toggleFavorite"
        @edit="openEdit"
        @delete="pendingDelete = $event"
        @add="openAdd"
      />
    </main>
  </div>

  <GameFormModal
    :open="formOpen"
    :game="editingGame"
    :saving="saving"
    @close="closeForm"
    @submit="saveGame"
  />

  <NextGamePicker :open="pickerOpen" @close="pickerOpen = false" @started="onStarted" />

  <ConfirmDialog
    :open="!!pendingDelete"
    title="Delete game?"
    :message="pendingDelete ? `“${pendingDelete.title}” will be permanently removed from your vault.` : ''"
    :busy="deleting"
    @confirm="confirmDelete"
    @cancel="!deleting && (pendingDelete = null)"
  />
</template>

<style scoped>
.app {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) 104px
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
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.user-name {
  display: none;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-muted);
  font-weight: 700;
}

@media (min-width: 640px) {
  .user-name {
    display: inline;
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.logo-icon {
  display: grid;
  place-items: center;
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  border-radius: 14px;
  color: #fff;
  background: linear-gradient(135deg, #a78bfa, #6d28d9);
  box-shadow: 0 0 24px rgba(139, 92, 246, 0.6);
}

.logo {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(24px, 6.5vw, 34px);
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1.1;
  color: var(--accent-soft);
  text-shadow: 0 0 18px rgba(139, 92, 246, 0.65), 0 0 36px rgba(139, 92, 246, 0.35);
}

:global([data-theme='light']) .logo {
  text-shadow: 0 0 16px rgba(139, 92, 246, 0.3);
}

.subtitle {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 15px;
}

.quick-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}

@media (min-width: 640px) {
  .quick-actions {
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }
}

.quick {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  color: var(--text);
  text-align: left;
  text-decoration: none;
  font: inherit;
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.quick:hover {
  border-color: var(--border-strong);
}

.quick:active {
  transform: scale(0.98);
}

.quick-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 12px;
  color: var(--c);
  background: color-mix(in srgb, var(--c) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--c) 35%, transparent);
}

.quick-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.quick-text strong {
  font-size: 17px;
  line-height: 1.2;
}

.quick-text span {
  color: var(--text-muted);
  font-size: 15px;
  font-weight: 500;
}

.quick-arrow {
  color: var(--text-muted);
  flex-shrink: 0;
}

.main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
