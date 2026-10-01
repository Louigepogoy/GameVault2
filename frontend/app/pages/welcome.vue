<script setup>
import { ArrowLeft, ArrowRight, Check, Gamepad2 } from 'lucide-vue-next';
import { GENRES, PLATFORM_PREFS, STATUS_LABELS, defaultPlatform } from '~/utils/constants';
import { pickLaunch } from '~/utils/launch';

// First-run welcome: 1) platforms, 2) genres, 3) add a few games. Skippable at any point.
useHead({ title: 'Welcome · GameVault' });

const api = useApi();
const toast = useToast();
const { user, updateUser } = useAuth();

const STEPS = ['Platforms', 'Genres', 'First games'];
const step = ref(0);
const direction = ref(1); // for the slide animation
const saving = ref(false);

const platforms = ref([...(user.value?.favorite_platforms ?? [])]);
const genres = ref([...(user.value?.favorite_genres ?? [])]);
const firstName = computed(() => user.value?.name?.trim().split(/\s+/)[0] || 'there');

function go(to) {
  direction.value = to > step.value ? 1 : -1;
  step.value = to;
}

// ---------- Step 3: add games ----------
const GOAL = 3;
const QUICK_STATUSES = ['playing', 'completed', 'backlog', 'wishlist'];
const query = ref('');
const picked = ref(null);
const added = ref([]);
const adding = ref(false);
const pickedCoverFailed = ref(false);

function onPick(game) {
  picked.value = game;
  pickedCoverFailed.value = false;
}

async function addPicked(status) {
  const g = picked.value;
  if (!g) return;
  adding.value = true;
  try {
    const platform = g.platform || defaultPlatform(platforms.value);
    const game = await api.createGame({
      title: g.title,
      genre: g.genre || null,
      platform,
      status,
      cover_url: g.cover_url || null,
      launch_url: pickLaunch(g.launch, platform),
    });
    added.value = [...added.value, game];
    picked.value = null;
    query.value = '';
  } catch (err) {
    toast.error(err.message);
  } finally {
    adding.value = false;
  }
}

// ---------- Save ----------
async function save({ completed }) {
  saving.value = true;
  try {
    const { user: next } = await api.updateMe({
      favorite_platforms: platforms.value,
      favorite_genres: genres.value,
      ...(completed && { onboarding_completed: true }),
    });
    updateUser(next);
    return true;
  } catch (err) {
    toast.error(err.message);
    return false;
  } finally {
    saving.value = false;
  }
}

async function next() {
  if (step.value < STEPS.length - 1) {
    // Save as we go, so nothing is lost if the tab closes.
    if (step.value === 1 && !(await save({ completed: false }))) return;
    go(step.value + 1);
    return;
  }
  await finish();
}

async function finish() {
  if (!(await save({ completed: true }))) return;
  toast.success(`You're all set, ${firstName.value}! 🎮`);
  await navigateTo('/');
}

const canSkip = computed(() => !saving.value);
const nextLabel = computed(() => {
  if (step.value < STEPS.length - 1) return 'Next';
  return added.value.length ? "Let's go!" : 'Finish';
});
</script>

<template>
  <div class="welcome">
    <header class="top">
      <AppLogo :size="38" />
      <button type="button" class="link skip" :disabled="!canSkip" @click="finish">Skip for now</button>
    </header>

    <main class="card panel">
      <div class="dots" role="img" :aria-label="`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`">
        <span v-for="(s, i) in STEPS" :key="s" class="dot" :class="{ on: i === step, done: i < step }" />
      </div>

      <AnimatePresence mode="wait">
        <Motion
          :key="step"
          class="step"
          :initial="{ opacity: 0, x: 28 * direction }"
          :animate="{ opacity: 1, x: 0 }"
          :exit="{ opacity: 0, x: -28 * direction }"
          :transition="{ duration: 0.22, ease: 'easeOut' }"
        >
          <!-- Step 1 -->
          <template v-if="step === 0">
            <h1>Hi {{ firstName }}! Where do you play?</h1>
            <p class="lead">Pick all that apply. This helps us suggest games for you.</p>
            <ChipSelect v-model="platforms" :options="PLATFORM_PREFS" label="Platforms you play on" />
          </template>

          <!-- Step 2 -->
          <template v-else-if="step === 1">
            <h1>What do you like to play?</h1>
            <p class="lead">Choose your favorite genres. You can change these later in Settings.</p>
            <ChipSelect v-model="genres" :options="GENRES" label="Favorite genres" />
          </template>

          <!-- Step 3 -->
          <template v-else>
            <h1>Add your first {{ GOAL }} games</h1>
            <p class="lead">
              Search for a game you're playing, finished, or want. {{ added.length }}/{{ GOAL }} added.
            </p>

            <label for="ob-title" class="sr-only">Search for a game</label>
            <TitleLookup
              id="ob-title"
              v-model="query"
              placeholder="Type a game, e.g. Elden Ring"
              @select="onPick"
            />

            <div v-if="picked" class="picked">
              <span class="cover">
                <img
                  v-if="picked.cover_url && !pickedCoverFailed"
                  :src="picked.cover_url"
                  alt=""
                  referrerpolicy="no-referrer"
                  @error="pickedCoverFailed = true"
                />
                <Gamepad2 v-else :size="22" />
              </span>
              <div class="picked-body">
                <p class="picked-title">{{ picked.title }}</p>
                <p class="picked-q">Where is it for you?</p>
                <div class="status-buttons" role="group" :aria-label="`Add ${picked.title} as`">
                  <button
                    v-for="s in QUICK_STATUSES"
                    :key="s"
                    type="button"
                    class="status-btn"
                    :class="`badge-${s}`"
                    :disabled="adding"
                    @click="addPicked(s)"
                  >
                    {{ STATUS_LABELS[s] }}
                  </button>
                </div>
              </div>
            </div>

            <ul v-if="added.length" class="added" aria-label="Games you added">
              <li v-for="g in added" :key="g.id">
                <Check :size="16" aria-hidden="true" />
                <strong>{{ g.title }}</strong>
                <span class="badge" :class="`badge-${g.status}`">{{ STATUS_LABELS[g.status] }}</span>
              </li>
            </ul>
            <p v-else-if="!picked" class="hint">No rush: you can always add games later.</p>
          </template>
        </Motion>
      </AnimatePresence>

      <footer class="actions">
        <button v-if="step > 0" type="button" class="btn btn-ghost" :disabled="saving" @click="go(step - 1)">
          <ArrowLeft :size="18" />
          Back
        </button>
        <span v-else />
        <button type="button" class="btn btn-primary" :disabled="saving" @click="next">
          {{ saving ? 'Saving...' : nextLabel }}
          <ArrowRight v-if="step < STEPS.length - 1" :size="18" />
        </button>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.welcome {
  position: relative;
  z-index: 1;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  max-width: 640px;
  margin: 0 auto;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
    max(24px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.skip {
  border: none;
  background: none;
  padding: 8px 4px;
  font: inherit;
  cursor: pointer;
}

.panel {
  display: flex;
  flex-direction: column;
  padding: 22px 20px;
  overflow: hidden;
}

@media (min-width: 560px) {
  .panel {
    padding: 28px;
  }
}

.dots {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--border-strong);
  transition:
    width 0.25s ease,
    background-color 0.25s ease;
}

.dot.done {
  background: var(--accent-soft);
}

.dot.on {
  width: 28px;
  background: var(--accent);
}

.step {
  min-height: 300px;
}

h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(22px, 5.5vw, 26px);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.lead {
  margin: 6px 0 18px;
  color: var(--text-muted);
  font-weight: 500;
}

.picked {
  display: flex;
  gap: 14px;
  margin-top: 14px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--border-strong);
  background: var(--surface-2);
}

.cover {
  display: grid;
  place-items: center;
  width: 60px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
  background: var(--surface-2);
  color: var(--accent-soft);
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.picked-body {
  min-width: 0;
}

.picked-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.picked-q {
  margin: 0 0 8px;
  color: var(--text-muted);
  font-weight: 500;
}

.status-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-btn {
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid currentColor;
  background: color-mix(in srgb, currentColor 12%, transparent);
  font-weight: 700;
}

.status-btn:hover {
  background: color-mix(in srgb, currentColor 22%, transparent);
}

.added {
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.added li {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.added li svg {
  color: var(--green);
  flex-shrink: 0;
}

.added strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hint {
  margin: 16px 0 0;
  color: var(--text-muted);
}

.actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 24px;
}
</style>
