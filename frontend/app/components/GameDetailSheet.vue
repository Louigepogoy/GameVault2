<script setup>
import { Clock, Gamepad2, History, Pencil, Play, Square, Star } from 'lucide-vue-next';
import { STATUS_LABELS, formatDuration, formatHours } from '~/utils/constants';

// Details for one game: info, play/stop, and its play session history.
const props = defineProps({
  open: { type: Boolean, default: false },
  game: { type: Object, default: null },
});
const emit = defineEmits(['close', 'edit']);

const api = useApi();
const { active, busy, version, start, stop } = useSession();

const PAGE_SIZE = 8;
const sessions = ref([]);
const totals = ref({ total: 0, total_minutes: 0 });
const page = ref(1);
const hasMore = ref(false);
const loading = ref(false);
const loadingMore = ref(false);
const error = ref('');

const isPlaying = computed(() => !!props.game && active.value?.game_id === props.game.id);

// Close this sheet first so the "Nice session!" sheet isn't stacked on top of it.
function stopFromHere() {
  emit('close');
  stop();
}

async function load({ more = false } = {}) {
  if (!props.game) return;
  error.value = '';
  if (more) loadingMore.value = true;
  else loading.value = true;
  try {
    const next = more ? page.value + 1 : 1;
    const res = await api.listSessions({ gameId: props.game.id, page: next, limit: PAGE_SIZE });
    sessions.value = more ? [...sessions.value, ...res.sessions] : res.sessions;
    totals.value = { total: res.total, total_minutes: res.total_minutes };
    page.value = next;
    hasMore.value = res.has_more;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

watch(
  () => [props.open, props.game?.id],
  ([open]) => {
    if (open) load();
  },
);
// A session for this game just ended: show it.
watch(version, () => props.open && load());

// "Tue, Sep 30" and "7:30 PM – 9:05 PM"
const day = (iso) => new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const time = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const coverFailed = ref(false);
watch(() => props.game?.cover_url, () => (coverFailed.value = false));
</script>

<template>
  <BaseSheet :open="open && !!game" :title="game?.title ?? ''" @close="emit('close')">
    <template v-if="game">
      <div class="top">
        <div class="cover">
          <img
            v-if="game.cover_url && !coverFailed"
            :src="game.cover_url"
            :alt="`${game.title} cover`"
            referrerpolicy="no-referrer"
            @error="coverFailed = true"
          />
          <div v-else class="cover-placeholder" aria-hidden="true"><Gamepad2 :size="34" /></div>
        </div>
        <div class="facts">
          <p class="meta">{{ [game.platform, game.genre].filter(Boolean).join(' • ') || 'No platform or genre yet' }}</p>
          <span class="badge" :class="`badge-${game.status}`">{{ STATUS_LABELS[game.status] }}</span>
          <p class="fact">
            <Clock :size="16" aria-hidden="true" />
            {{ game.hours_played ? `${formatHours(game.hours_played)} played` : 'No time logged yet' }}
          </p>
          <p v-if="game.rating" class="fact">
            <Star :size="16" class="star" aria-hidden="true" />
            Rated {{ game.rating }} out of 5
          </p>
        </div>
      </div>

      <p v-if="game.notes" class="notes">{{ game.notes }}</p>

      <div class="actions">
        <button v-if="isPlaying" type="button" class="btn btn-stop" :disabled="busy" @click="stopFromHere">
          <Square :size="16" fill="currentColor" />
          Stop Session
        </button>
        <button v-else type="button" class="btn btn-primary" :disabled="busy" @click="start(game)">
          <Play :size="18" />
          {{ active ? 'Switch to This Game' : 'Start Playing' }}
        </button>
        <button type="button" class="btn btn-ghost" @click="emit('edit', game)">
          <Pencil :size="16" />
          Edit
        </button>
      </div>

      <section class="history" aria-labelledby="history-title">
        <div class="history-head">
          <h3 id="history-title"><History :size="18" aria-hidden="true" /> Play sessions</h3>
          <span v-if="totals.total" class="history-total">
            {{ totals.total }} session{{ totals.total === 1 ? '' : 's' }} · {{ formatDuration(totals.total_minutes) }}
          </span>
        </div>

        <div v-if="loading" class="list" aria-hidden="true">
          <div v-for="n in 3" :key="n" class="skeleton sk-row" />
        </div>

        <p v-else-if="error" class="form-alert form-alert-error" role="alert">
          {{ error }} <button type="button" class="link retry" @click="load()">Try again</button>
        </p>

        <p v-else-if="!sessions.length" class="empty">
          No sessions yet. Tap <strong>Start Playing</strong> and the timer will log your time here.
        </p>

        <template v-else>
          <ul class="list">
            <li v-for="s in sessions" :key="s.id" class="row">
              <div class="row-main">
                <span class="row-day">{{ day(s.started_at) }}</span>
                <span class="row-time">{{ time(s.started_at) }} – {{ time(s.ended_at) }}</span>
                <p v-if="s.note" class="row-note">“{{ s.note }}”</p>
              </div>
              <span class="row-duration">{{ formatDuration(s.duration_minutes) }}</span>
            </li>
          </ul>
          <button v-if="hasMore" type="button" class="btn btn-ghost more" :disabled="loadingMore" @click="load({ more: true })">
            {{ loadingMore ? 'Loading...' : 'Show older sessions' }}
          </button>
        </template>
      </section>
    </template>
  </BaseSheet>
</template>

<style scoped>
.top {
  display: flex;
  gap: 16px;
}

.cover {
  width: 104px;
  aspect-ratio: 3 / 4;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--surface-2);
}

.cover img {
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
}

.facts {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.meta {
  margin: 0;
  color: var(--text-muted);
  font-weight: 600;
}

.fact {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-weight: 600;
}

.star {
  color: #fbbf24;
  fill: #fbbf24;
}

.notes {
  margin: 14px 0 0;
  color: var(--text-muted);
  white-space: pre-line;
}

.actions {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 10px;
  margin-top: 16px;
}

.btn-stop {
  color: #fff;
  background: var(--red);
}

.history {
  margin-top: 22px;
}

.history-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

h3 {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.history-total {
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sk-row {
  height: 54px;
  border-radius: 12px;
}

.row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface-2);
}

.row-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.row-day {
  font-weight: 700;
}

.row-time {
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 600;
}

.row-note {
  margin: 4px 0 0;
  font-size: 15px;
  overflow-wrap: anywhere;
}

.row-duration {
  flex-shrink: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.empty {
  margin: 0;
  padding: 14px;
  border-radius: 12px;
  border: 1px dashed var(--border-strong);
  color: var(--text-muted);
  font-weight: 500;
}

.retry {
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
}

.more {
  width: 100%;
  margin-top: 10px;
}
</style>
