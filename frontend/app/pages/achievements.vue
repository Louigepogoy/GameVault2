<script setup>
import { ArrowLeft, CheckCircle2, Lock } from 'lucide-vue-next';
import { formatDuration } from '~/utils/constants';

useHead({ title: 'Achievements · GameVault' });

const api = useApi();

// Client-only: loading this also unlocks anything already earned, and that toast should
// show in the browser.
const achievements = ref([]);
const loading = ref(true);
const error = ref('');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    ({ achievements: achievements.value } = await api.getAchievements());
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
onMounted(load);

const unlockedCount = computed(() => achievements.value.filter((a) => a.unlocked).length);
const percent = computed(() =>
  achievements.value.length ? Math.round((unlockedCount.value / achievements.value.length) * 100) : 0,
);
// Unlocked first (newest first), then the closest to unlocking.
const sorted = computed(() =>
  [...achievements.value].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    if (a.unlocked) return new Date(b.unlocked_at) - new Date(a.unlocked_at);
    return b.progress.current / b.progress.target - a.progress.current / a.progress.target;
  }),
);

// "3/5 genres", "1h 20m / 3h", "0/1"
function progressText({ current, target, unit }) {
  if (unit === 'minutes') return `${formatDuration(current)} / ${formatDuration(target)}`;
  return `${current}/${target}${unit ? ` ${unit}` : ''}`;
}
const unlockedDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
</script>

<template>
  <div class="app">
    <header class="header">
      <NuxtLink to="/" class="icon-btn" aria-label="Back to your games">
        <ArrowLeft :size="20" />
      </NuxtLink>
      <div class="heading">
        <h1 class="page-title">Achievements</h1>
        <p class="page-sub">
          {{ loading ? 'Checking your badges...' : `${unlockedCount} of ${achievements.length} unlocked` }}
        </p>
      </div>
      <ThemeToggle />
    </header>

    <main class="main">
      <div v-if="loading" class="grid" aria-hidden="true">
        <div v-for="n in 6" :key="n" class="card ach skeleton-card">
          <div class="skeleton sk-icon" />
          <div class="skeleton sk-line" />
          <div class="skeleton sk-line short" />
        </div>
      </div>

      <p v-else-if="error" class="form-alert form-alert-error" role="alert">
        {{ error }} <button type="button" class="link retry" @click="load">Try again</button>
      </p>

      <template v-else>
        <section class="card overall" aria-label="Overall progress">
          <div class="overall-head">
            <span>Collection</span>
            <strong>{{ percent }}%</strong>
          </div>
          <div
            class="track"
            role="progressbar"
            :aria-valuenow="percent"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Achievements unlocked"
          >
            <Motion
              class="fill"
              :initial="{ width: '0%' }"
              :animate="{ width: `${percent}%` }"
              :transition="{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }"
            />
          </div>
        </section>

        <ul class="grid">
          <Motion
            v-for="(a, i) in sorted"
            :key="a.code"
            as="li"
            class="card ach"
            :class="{ locked: !a.unlocked }"
            :initial="{ opacity: 0, y: 14 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ type: 'spring', stiffness: 260, damping: 24, delay: i * 0.05 }"
          >
            <div class="ach-icon" aria-hidden="true">
              <span class="emoji">{{ a.icon }}</span>
              <span v-if="!a.unlocked" class="lock"><Lock :size="13" /></span>
            </div>
            <div class="ach-body">
              <h2 class="ach-title">{{ a.title }}</h2>
              <p class="ach-desc">{{ a.description }}</p>

              <p v-if="a.unlocked" class="ach-done">
                <CheckCircle2 :size="16" aria-hidden="true" />
                Unlocked {{ unlockedDate(a.unlocked_at) }}
              </p>
              <div v-else-if="a.progress.current > 0" class="ach-progress">
                <div
                  class="mini-track"
                  role="progressbar"
                  :aria-valuenow="a.progress.current"
                  aria-valuemin="0"
                  :aria-valuemax="a.progress.target"
                  :aria-label="`${a.title} progress`"
                >
                  <div
                    class="mini-fill"
                    :style="{ width: `${(a.progress.current / a.progress.target) * 100}%` }"
                  />
                </div>
                <span class="ach-count">{{ progressText(a.progress) }}</span>
              </div>
              <p v-else class="ach-locked-note">Locked</p>
            </div>
          </Motion>
        </ul>
      </template>
    </main>
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
  gap: 16px;
}

.overall {
  padding: 16px 18px;
}

.overall-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-weight: 700;
}

.overall-head strong {
  font-family: var(--font-display);
  color: var(--accent-soft);
  font-variant-numeric: tabular-nums;
}

.track {
  height: 12px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #d97706, #f59e0b, #fbbf24);
}

.grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
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

.ach {
  display: flex;
  gap: 14px;
  padding: 16px;
}

.ach:not(.locked) {
  border-color: color-mix(in srgb, var(--amber) 45%, transparent);
  box-shadow:
    var(--shadow),
    0 0 22px color-mix(in srgb, var(--amber) 14%, transparent);
}

.ach-icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 16px;
  background: color-mix(in srgb, var(--amber) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--amber) 40%, transparent);
}

.emoji {
  font-size: 28px;
  line-height: 1;
}

.locked .ach-icon {
  background: var(--surface-2);
  border-color: var(--border);
}

.locked .emoji {
  filter: grayscale(1);
  opacity: 0.45;
}

.lock {
  position: absolute;
  right: -6px;
  bottom: -6px;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--surface-solid);
  border: 1px solid var(--border-strong);
  color: var(--text-muted);
}

.ach-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.ach-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.locked .ach-title {
  color: var(--text-muted);
}

.ach-desc {
  margin: 0;
  color: var(--text-muted);
  font-size: 15px;
  font-weight: 500;
}

.ach-done {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0 0;
  color: var(--green);
  font-size: 14px;
  font-weight: 700;
}

.ach-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
}

.mini-track {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  overflow: hidden;
}

.mini-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
}

.ach-count {
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.ach-locked-note {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 600;
}

.skeleton-card {
  flex-direction: column;
}

.sk-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
}

.sk-line {
  height: 14px;
  width: 80%;
}

.sk-line.short {
  width: 50%;
}

.retry {
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
}
</style>
