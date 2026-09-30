<script setup>
import { Dices, Gamepad2, Play } from 'lucide-vue-next';
import { STATUSES, STATUS_LABELS } from '~/utils/constants';

// Picks a random game (by default from the backlog), with a short slot-machine shuffle.
// Filters: status and platform. There is no "estimated length" field on games yet,
// so a length filter is left out rather than guessing.
const props = defineProps({
  open: { type: Boolean, default: false },
});
const emit = defineEmits(['close', 'started']);

const api = useApi();
const toast = useToast();
const session = useSession();

const allGames = ref([]);
const filters = reactive({ status: 'backlog', platform: '' });
const current = ref(null);
const loading = ref(false);
const rolling = ref(false);
const starting = ref(false);
const error = ref('');
const coverFailed = ref(false);
let timer;

const platforms = computed(() =>
  [...new Set(allGames.value.map((g) => g.platform).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
);

const pool = computed(() =>
  allGames.value.filter(
    (g) =>
      (filters.status === 'any' || g.status === filters.status) &&
      (!filters.platform || g.platform === filters.platform),
  ),
);

const filtersAreDefault = computed(() => filters.status === 'backlog' && !filters.platform);
const poolLabel = computed(() => {
  const n = pool.value.length;
  const what = filters.status === 'any' ? 'game' : `${STATUS_LABELS[filters.status].toLowerCase()} game`;
  return `Picked from ${n} ${what}${n === 1 ? '' : 's'}${filters.platform ? ` on ${filters.platform}` : ''}`;
});

function resetFilters() {
  filters.status = 'backlog';
  filters.platform = '';
}

// New filters -> new pick.
watch(
  () => [filters.status, filters.platform],
  () => {
    if (!loading.value) roll();
  },
);

const randomFrom = (list) => list[Math.floor(Math.random() * list.length)] ?? null;

function roll() {
  clearInterval(timer);
  if (!pool.value.length) {
    current.value = null;
    return;
  }
  // Avoid landing on the same game twice in a row when there is a choice.
  const others = pool.value.filter((g) => g.id !== current.value?.id);
  const final = randomFrom(others.length ? others : pool.value);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || pool.value.length === 1) {
    current.value = final;
    return;
  }

  rolling.value = true;
  let ticks = 0;
  timer = setInterval(() => {
    current.value = randomFrom(pool.value);
    if (++ticks >= 14) {
      clearInterval(timer);
      current.value = final;
      rolling.value = false;
    }
  }, 70);
}

async function load() {
  loading.value = true;
  error.value = '';
  current.value = null;
  try {
    // One request; filtering happens here so changing a filter is instant.
    allGames.value = await api.listGames();
    roll();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function start() {
  const game = current.value;
  if (!game) return;
  starting.value = true;
  try {
    if (game.status !== 'playing') await api.updateGame(game.id, { status: 'playing' });
    // Starts the timer too (saving any other running session first).
    if (await session.start(game)) emit('started', game);
  } catch (err) {
    toast.error(err.message);
  } finally {
    starting.value = false;
  }
}

watch(
  () => current.value?.cover_url,
  () => (coverFailed.value = false),
);

watch(
  () => props.open,
  (open) => {
    if (open) load();
    else {
      clearInterval(timer);
      rolling.value = false;
    }
  },
);

onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <BaseSheet :open="open" title="What should I play next?" size="sm" @close="emit('close')">
    <div v-if="loading" class="pick" aria-hidden="true">
      <div class="skeleton pick-cover" />
      <div class="skeleton sk-line" />
    </div>

    <p v-else-if="error" class="form-alert form-alert-error" role="alert">{{ error }}</p>

    <template v-else>
      <div v-if="allGames.length" class="filters">
        <label for="pick-status" class="sr-only">Status</label>
        <select id="pick-status" v-model="filters.status" class="field" :disabled="rolling">
          <option v-for="s in STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
          <option value="any">Any status</option>
        </select>
        <label for="pick-platform" class="sr-only">Platform</label>
        <select id="pick-platform" v-model="filters.platform" class="field" :disabled="rolling">
          <option value="">Any platform</option>
          <option v-for="p in platforms" :key="p" :value="p">{{ p }}</option>
        </select>
      </div>

      <div v-if="!allGames.length" class="empty">
        <div class="emoji" aria-hidden="true">🎮</div>
        <p class="empty-title">Your vault is empty</p>
        <p class="muted">Add a few games first and I'll pick one for you.</p>
      </div>

      <div v-else-if="!current && filtersAreDefault" class="empty">
        <div class="emoji" aria-hidden="true">🎉</div>
        <p class="empty-title">Your backlog is empty!</p>
        <p class="muted">
          Nothing waiting. Try <strong>Any status</strong> above, or add games to your Backlog.
        </p>
      </div>

      <div v-else-if="!current" class="empty">
        <div class="emoji" aria-hidden="true">🤔</div>
        <p class="empty-title">No games match these filters</p>
        <p class="muted">Try another status or platform.</p>
        <button type="button" class="btn btn-ghost reset" @click="resetFilters">Reset filters</button>
      </div>

      <template v-else>
        <div class="pick" :class="{ rolling }" :aria-live="rolling ? 'off' : 'polite'">
          <!-- Re-keyed when the shuffle lands, so the final pick pops in. -->
          <Motion
            :key="rolling ? 'rolling' : current.id"
            class="pick-cover"
            :initial="rolling ? false : { scale: 0.85, rotate: -4 }"
            :animate="{ scale: 1, rotate: 0 }"
            :transition="{ type: 'spring', stiffness: 420, damping: 14 }"
          >
            <img
              v-if="current.cover_url && !coverFailed"
              :src="current.cover_url"
              :alt="`${current.title} cover`"
              referrerpolicy="no-referrer"
              @error="coverFailed = true"
            />
            <div v-else class="cover-placeholder" aria-hidden="true">
              <Gamepad2 :size="40" />
            </div>
          </Motion>
          <p class="pick-title">{{ current.title }}</p>
          <p class="muted">
            {{ [current.platform, current.genre].filter(Boolean).join(' • ') || 'From your backlog' }}
          </p>
        </div>

        <p class="pool muted">{{ poolLabel }}</p>

        <div class="actions">
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="rolling || starting || pool.length < 2"
            @click="roll"
          >
            <Dices :size="18" />
            Spin Again
          </button>
          <button type="button" class="btn btn-primary" :disabled="rolling || starting" @click="start">
            <Play :size="18" />
            {{ starting ? 'Starting...' : 'Start Playing' }}
          </button>
        </div>
      </template>
    </template>
  </BaseSheet>
</template>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}

.reset {
  margin-top: 12px;
}

.pick {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
  padding: 4px 0 8px;
}

.pick-cover {
  width: 132px;
  aspect-ratio: 3 / 4;
  margin-bottom: 10px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--border-strong);
  background: var(--surface-2);
  box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
  transition:
    transform 0.2s ease,
    filter 0.2s ease;
}

.pick-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--accent-soft);
  background:
    radial-gradient(circle at 30% 20%, rgba(139, 92, 246, 0.35), transparent 60%),
    radial-gradient(circle at 80% 90%, rgba(244, 63, 94, 0.2), transparent 55%);
}

.rolling .pick-cover {
  filter: blur(1.5px);
}

.rolling .pick-title {
  opacity: 0.6;
}

.pick-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.muted {
  margin: 0;
  color: var(--text-muted);
  font-weight: 500;
}

.pool {
  margin: 8px 0 16px;
  text-align: center;
  font-size: 14px;
}

.sk-line {
  width: 60%;
  height: 20px;
}

.empty {
  text-align: center;
  padding: 8px 0 12px;
}

.emoji {
  font-size: 44px;
  line-height: 1;
  margin-bottom: 8px;
}

.empty-title {
  margin: 0 0 4px;
  font-size: 19px;
  font-weight: 700;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
</style>
