<script setup>
import { Gamepad2, Square, X } from 'lucide-vue-next';
import { formatClock, formatDuration } from '~/utils/constants';

// Sticky bar with a live timer for the running play session, on every page.
const api = useApi();
const toast = useToast();
const { loggedIn } = useAuth();
const { active, skewMs, busy, justStopped, refresh, reset, stop, discard } = useSession();

// Ticks once a second; the elapsed time itself comes from started_at.
const now = ref(Date.now());
let ticker;
const elapsedSeconds = computed(() =>
  active.value ? (now.value + skewMs.value - new Date(active.value.started_at).getTime()) / 1000 : 0,
);
const clock = computed(() => formatClock(elapsedSeconds.value));

// Re-sync when the app comes back to the foreground (phone unlocked, tab switched back):
// the session may have been stopped on another device.
const onVisible = () => document.visibilityState === 'visible' && loggedIn.value && refresh();

onMounted(() => {
  ticker = setInterval(() => (now.value = Date.now()), 1000);
  document.addEventListener('visibilitychange', onVisible);
  if (loggedIn.value) refresh();
});
onBeforeUnmount(() => {
  clearInterval(ticker);
  document.removeEventListener('visibilitychange', onVisible);
  document.body.classList.remove('has-now-playing');
});

watch(loggedIn, (yes) => (yes ? refresh() : reset()));

// Lets the page make room for the bar (see main.css).
watch(
  () => !!active.value,
  (on) => import.meta.client && document.body.classList.toggle('has-now-playing', on),
  { immediate: true },
);

// ---------- "Nice session!" sheet ----------
const note = ref('');
const savingNote = ref(false);
watch(justStopped, () => (note.value = ''));

async function saveNote() {
  const session = justStopped.value;
  if (!session) return;
  if (!note.value.trim()) {
    justStopped.value = null;
    return;
  }
  savingNote.value = true;
  try {
    await api.updateSessionNote(session.id, note.value);
    toast.success('Note saved.');
    justStopped.value = null;
  } catch (err) {
    toast.error(err.message);
  } finally {
    savingNote.value = false;
  }
}

const coverFailed = ref(false);
watch(
  () => active.value?.game_cover_url,
  () => (coverFailed.value = false),
);
</script>

<template>
  <AnimatePresence>
    <Motion
      v-if="loggedIn && active"
      key="now-playing"
      class="now-playing"
      role="region"
      aria-label="Now playing"
      :initial="{ y: 90, opacity: 0 }"
      :animate="{ y: 0, opacity: 1 }"
      :exit="{ y: 90, opacity: 0 }"
      :transition="{ type: 'spring', stiffness: 380, damping: 32 }"
    >
      <div class="np-inner">
        <span class="np-cover">
          <img
            v-if="active.game_cover_url && !coverFailed"
            :src="active.game_cover_url"
            alt=""
            referrerpolicy="no-referrer"
            @error="coverFailed = true"
          />
          <Gamepad2 v-else :size="20" />
        </span>
        <span class="np-text">
          <span class="np-label"><span class="live-dot" aria-hidden="true" /> Now playing</span>
          <span class="np-title">{{ active.game_title }}</span>
        </span>
        <span class="np-clock" role="timer" :aria-label="`Playing for ${clock}`">{{ clock }}</span>
        <button
          type="button"
          class="icon-btn np-discard"
          :disabled="busy"
          aria-label="Discard this session"
          title="Started by mistake? Discard (no time is saved)"
          @click="discard"
        >
          <X :size="18" />
        </button>
        <button type="button" class="btn np-stop" :disabled="busy" @click="stop()">
          <Square :size="16" fill="currentColor" />
          Stop
        </button>
      </div>
    </Motion>
  </AnimatePresence>

  <BaseSheet :open="!!justStopped" title="Nice session! 🎮" size="sm" @close="justStopped = null">
    <template v-if="justStopped">
      <p class="summary">
        You played <strong>{{ justStopped.game_title }}</strong> for
        <strong>{{ formatDuration(justStopped.duration_minutes) }}</strong
        >.
        <template v-if="justStopped.game_hours_played">
          That's {{ justStopped.game_hours_played }}h in total.
        </template>
      </p>
      <form class="note-form" @submit.prevent="saveNote">
        <label for="session-note">Quick note <span class="optional">(optional)</span></label>
        <textarea
          id="session-note"
          v-model="note"
          class="field"
          rows="3"
          maxlength="500"
          placeholder="Beat a boss? Reached a new area? Write it down."
          autofocus
        />
        <div class="note-actions">
          <button type="button" class="btn btn-ghost" @click="justStopped = null">Skip</button>
          <button type="submit" class="btn btn-primary" :disabled="savingNote">
            {{ savingNote ? 'Saving...' : note.trim() ? 'Save Note' : 'Done' }}
          </button>
        </div>
      </form>
    </template>
  </BaseSheet>
</template>

<style scoped>
.now-playing {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 60;
  padding: 0 max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom))
    max(12px, env(safe-area-inset-left));
  pointer-events: none;
}

.np-inner {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 8px 8px 10px;
  border-radius: 18px;
  border: 1px solid var(--border-strong);
  background: var(--surface-solid);
  box-shadow:
    0 12px 36px rgba(0, 0, 0, 0.35),
    0 0 24px rgba(139, 92, 246, 0.2);
  pointer-events: auto;
}

.np-cover {
  display: grid;
  place-items: center;
  width: 40px;
  height: 52px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface-2);
  color: var(--accent-soft);
}

.np-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.np-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.np-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--green);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 1.6s ease-in-out infinite;
}

@keyframes pulse {
  50% {
    opacity: 0.3;
  }
}

.np-title {
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.np-clock {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

.np-discard {
  width: 40px;
  height: 40px;
}

.np-stop {
  min-height: 40px;
  padding: 0 14px;
  color: #fff;
  background: var(--red);
}

.summary {
  margin: 0 0 16px;
  font-size: 17px;
}

.note-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.note-form label {
  font-weight: 700;
  font-size: 15px;
}

.optional {
  color: var(--text-muted);
  font-weight: 500;
}

.note-form textarea {
  resize: vertical;
}

.note-actions {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 10px;
  margin-top: 10px;
}
</style>
