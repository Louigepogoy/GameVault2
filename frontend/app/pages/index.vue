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

// ---------- Quick actions ----------
const NuxtLinkComponent = resolveComponent('NuxtLink');
const quickActions = computed(() => {
  const s = shownStats.value;
  const list = [
    { key: 'discover', to: '/discover', icon: Compass, color: 'var(--green)', title: 'Discover games', text: 'Suggestions with download links' },
  ];
  if (s?.total) {
    list.push(
      {
        key: 'picker',
        onClick: () => (pickerOpen.value = true),
        icon: Dices,
        color: 'var(--amber)',
        title: 'What should I play next?',
        text: s.backlog ? `Pick from ${plural(s.backlog, 'backlog game')}` : 'Random pick from your backlog',
      },
      { key: 'insights', to: '/insights', icon: BarChart3, color: 'var(--accent-soft)', title: 'Insights', text: 'Hours played, top genres & more' },
    );
  }
  return list;
});

// ---------- Greeting ----------
// Time of day is only known in the browser, so the server renders a neutral greeting.
const greeting = ref('Welcome back');
onMounted(() => {
  const h = new Date().getHours();
  greeting.value = h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
});
const firstName = computed(() => user.value?.name?.trim().split(/\s+/)[0] || 'gamer');
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const vibe = computed(() => {
  const s = shownStats.value;
  if (!s) return 'Loading your vault...';
  if (!s.total) return "Your vault is empty. Let's add your first game!";
  const playing = games.value.find((g) => g.status === 'playing');
  if (playing) return `Still playing ${playing.title}? Don't forget to log your hours.`;
  if (s.completed === s.total) return "You've finished everything. Time to discover something new!";
  if (s.backlog) return `${plural(s.backlog, 'game')} waiting in your backlog.`;
  return `${plural(s.total, 'game')} in your vault.`;
});

// ---------- Delete with Undo ----------
// The card disappears right away, but the server delete waits until the Undo toast
// goes away, so a misclick can be taken back.
const UNDO_MS = 6000;
const pendingDeletes = new Map(); // game id -> { game, index, toastId }
const pendingGames = ref([]); // same games, reactive, for the numbers below

// Server stats minus games waiting to be deleted. Derived (not patched) so a stats
// refresh that lands mid-Undo can't double-count or lose anything.
const shownStats = computed(() => {
  const s = stats.value;
  if (!s) return s;
  const out = { ...s };
  for (const g of pendingGames.value) {
    out.total -= 1;
    if (g.favorite) out.favorites -= 1;
    if (g.status === 'completed') out.completed -= 1;
    if (g.status === 'playing') out.playing -= 1;
    if (g.status === 'backlog') out.backlog -= 1;
  }
  return out;
});
const unpend = (id) => (pendingGames.value = pendingGames.value.filter((g) => g.id !== id));

function deleteGame(game) {
  const index = games.value.findIndex((g) => g.id === game.id);
  games.value = games.value.filter((g) => g.id !== game.id);
  pendingGames.value = [...pendingGames.value, game];
  const toastId = toast.info(`"${game.title}" deleted`, {
    duration: UNDO_MS,
    action: { label: 'Undo', onClick: () => undoDelete(game.id) },
    onClose: () => commitDelete(game.id),
  });
  pendingDeletes.set(game.id, { game, index, toastId });
}

function undoDelete(id) {
  const pending = pendingDeletes.get(id);
  if (!pending) return;
  pendingDeletes.delete(id);
  const list = [...games.value];
  list.splice(Math.min(pending.index, list.length), 0, pending.game);
  games.value = list;
  unpend(id);
  toast.success(`"${pending.game.title}" is back 👍`);
}

async function commitDelete(id) {
  const pending = pendingDeletes.get(id);
  if (!pending) return;
  pendingDeletes.delete(id);
  try {
    await api.deleteGame(id);
    await refreshStats(); // fresh numbers first, then stop subtracting, so nothing flickers
  } catch (err) {
    toast.error(`Couldn't delete "${pending.game.title}": ${err.message}`);
    refreshGames();
  } finally {
    unpend(id);
  }
}

// Leaving the page (or closing the tab) finishes any deletes still waiting for Undo.
function flushDeletes(onExit = false) {
  for (const [id, pending] of pendingDeletes) {
    pendingDeletes.delete(id);
    unpend(id);
    toast.dismiss(pending.toastId, { viaAction: true }); // the Undo button would no longer work
    if (onExit) api.deleteGameOnExit(id);
    else api.deleteGame(id).catch(() => {});
  }
}
const onPageHide = () => flushDeletes(true);
onMounted(() => window.addEventListener('pagehide', onPageHide));
onBeforeUnmount(() => {
  window.removeEventListener('pagehide', onPageHide);
  flushDeletes();
});

// ---------- Keyboard shortcuts ----------
// "/" jumps to search, "N" adds a game (ignored while typing or when a dialog is open).
function onShortcut(e) {
  if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
  const el = e.target;
  if (el.closest?.('input, textarea, select, [contenteditable="true"]')) return;
  if (formOpen.value || pickerOpen.value || document.querySelector('[role="dialog"]')) return;
  if (e.key === '/') {
    e.preventDefault();
    document.getElementById('search-input')?.focus();
  } else if (e.key === 'n' || e.key === 'N') {
    e.preventDefault();
    openAdd();
  }
}
onMounted(() => window.addEventListener('keydown', onShortcut));
onBeforeUnmount(() => window.removeEventListener('keydown', onShortcut));

function clearFilters() {
  search.value = '';
  status.value = '';
  favorites.value = false;
}

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
      const before = editingGame.value;
      const updated = await api.updateGame(before.id, payload);
      games.value = games.value.map((g) => (g.id === updated.id ? updated : g));
      if (updated.status === 'completed' && before.status !== 'completed') {
        toast.success(`🏆 GG! You finished "${updated.title}".`);
      } else if (updated.status === 'playing' && before.status !== 'playing') {
        toast.success(`▶️ Have fun with "${updated.title}"!`);
      } else {
        toast.success(`Saved your changes to "${updated.title}".`);
      }
    } else {
      const created = await api.createGame(payload);
      toast.success(`🎮 "${created.title}" is in your vault!`);
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

// The list is shallow-reactive, so replace the game object instead of mutating it.
const setFavorite = (id, favorite) =>
  (games.value = games.value.map((g) => (g.id === id ? { ...g, favorite } : g)));

async function toggleFavorite(game) {
  const favorite = !game.favorite;
  setFavorite(game.id, favorite); // optimistic
  try {
    await api.updateGame(game.id, { favorite });
    toast.success(favorite ? `❤️ "${game.title}" is now a favorite.` : `Removed "${game.title}" from favorites.`);
    if (favorites.value) refreshGames(); // drop it from the favorites-only list
    refreshStats();
  } catch (err) {
    setFavorite(game.id, !favorite);
    toast.error(err.message);
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
      <Motion
        as="section"
        class="welcome"
        aria-live="polite"
        :initial="{ opacity: 0, y: 8 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.4, ease: 'easeOut' }"
      >
        <h2 class="welcome-title">{{ greeting }}, {{ firstName }} <span class="wave" aria-hidden="true">👋</span></h2>
        <p class="welcome-sub">{{ vibe }}</p>
      </Motion>

      <StatsCards :stats="shownStats" />
      <ProgressBar :completed="shownStats?.completed ?? 0" :total="shownStats?.total ?? 0" />

      <nav class="quick-actions" aria-label="Quick actions">
        <Motion
          v-for="(action, i) in quickActions"
          :key="action.key"
          class="quick-wrap"
          :initial="{ opacity: 0, y: 12 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ type: 'spring', stiffness: 260, damping: 24, delay: 0.25 + i * 0.07 }"
          :while-hover="{ y: -3 }"
          :while-press="{ scale: 0.98 }"
        >
          <component
            :is="action.to ? NuxtLinkComponent : 'button'"
            :to="action.to"
            :type="action.to ? undefined : 'button'"
            class="card quick"
            :style="{ '--c': action.color }"
            @click="action.onClick?.()"
          >
            <span class="quick-icon"><component :is="action.icon" :size="22" /></span>
            <span class="quick-text">
              <strong>{{ action.title }}</strong>
              <span>{{ action.text }}</span>
            </span>
            <ChevronRight class="quick-arrow" :size="20" aria-hidden="true" />
          </component>
        </Motion>
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
        @delete="deleteGame"
        @add="openAdd"
        @clear-filters="clearFilters"
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

.quick-wrap {
  display: flex;
  min-width: 0;
}

.quick {
  flex: 1;
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

.welcome {
  margin: -4px 0 2px;
}

.welcome-title {
  margin: 0;
  font-size: clamp(22px, 5.5vw, 28px);
  font-weight: 700;
  line-height: 1.2;
}

.welcome-sub {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-size: 16px;
  font-weight: 500;
}

/* A friendly wave, once, when the page opens. */
.wave {
  display: inline-block;
  transform-origin: 70% 70%;
  animation: wave 1.6s ease-in-out 0.4s 1;
}

@keyframes wave {
  0%, 60%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(14deg); }
  20% { transform: rotate(-8deg); }
  40% { transform: rotate(-4deg); }
  50% { transform: rotate(10deg); }
}

.main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
