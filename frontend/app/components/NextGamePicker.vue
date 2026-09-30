<script setup>
import { Dices, Gamepad2, Play } from 'lucide-vue-next';

// Picks a random game from the backlog, with a short slot-machine shuffle.
const props = defineProps({
  open: { type: Boolean, default: false },
});
const emit = defineEmits(['close', 'started']);

const api = useApi();
const toast = useToast();

const pool = ref([]);
const current = ref(null);
const loading = ref(false);
const rolling = ref(false);
const starting = ref(false);
const error = ref('');
const coverFailed = ref(false);
let timer;

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
    pool.value = await api.listGames({ status: 'backlog' });
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
    await api.updateGame(game.id, { status: 'playing' });
    toast.success(`Have fun playing "${game.title}"!`);
    emit('started', game);
  } catch (err) {
    toast.error(err.message);
  } finally {
    starting.value = false;
  }
}

watch(() => current.value?.cover_url, () => (coverFailed.value = false));

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

    <div v-else-if="!current" class="empty">
      <div class="emoji" aria-hidden="true">🎉</div>
      <p class="empty-title">Your backlog is empty!</p>
      <p class="muted">Add games with the <strong>Backlog</strong> status and I'll pick one for you.</p>
    </div>

    <template v-else>
      <div class="pick" :class="{ rolling }" :aria-live="rolling ? 'off' : 'polite'">
        <div class="pick-cover">
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
        </div>
        <p class="pick-title">{{ current.title }}</p>
        <p class="muted">
          {{ [current.platform, current.genre].filter(Boolean).join(' • ') || 'From your backlog' }}
        </p>
      </div>

      <p class="pool muted">Picked from {{ pool.length }} backlog game{{ pool.length === 1 ? '' : 's' }}</p>

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
  </BaseSheet>
</template>

<style scoped>
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
  transition: transform 0.2s ease, filter 0.2s ease;
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
  transform: scale(0.94) rotate(-2deg);
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
  letter-spacing: 0.03em;
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
