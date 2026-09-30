<script setup>
import { ArrowLeft, Clock, Heart, Star, Trophy } from 'lucide-vue-next';
import { STATUS_LABELS, formatHours } from '~/utils/constants';

useHead({ title: 'Insights · GameVault' });

const api = useApi();
const toast = useToast();

// Same key as the home page, so both share one cached copy of the stats.
const {
  data: stats,
  error,
  status,
} = await useAsyncData('stats', () => api.getStats(), { default: () => null });
watch(error, (err) => err && toast.error(err.message));
onMounted(() => error.value && toast.error(error.value.message));

const loading = computed(() => status.value === 'pending' && !stats.value);
const shownHours = useCountUp(() => stats.value?.hours, { duration: 1.2, decimals: 1 });

// Stack order and colors were checked for colorblind safety in both themes (see main.css).
const STATUS_ORDER = ['backlog', 'dropped', 'playing', 'completed'];

const statusParts = computed(() => {
  const counts = Object.fromEntries((stats.value?.by_status ?? []).map((s) => [s.label, s.count]));
  const total = stats.value?.total || 0;
  return STATUS_ORDER.map((key) => {
    const count = counts[key] ?? 0;
    return {
      key,
      label: STATUS_LABELS[key],
      count,
      pct: total ? Math.round((count / total) * 100) : 0,
      share: total ? (count / total) * 100 : 0,
    };
  });
});

const completionRate = computed(() => {
  const s = stats.value;
  return s?.total ? Math.round((s.completed / s.total) * 100) : 0;
});

const playedGames = computed(() => stats.value?.most_played?.length ?? 0);

const tiles = computed(() => {
  const s = stats.value;
  if (!s) return [];
  return [
    {
      key: 'rating',
      label: 'Average rating',
      value: s.avg_rating ? s.avg_rating.toFixed(1) : '–',
      sub: s.rated ? `from ${s.rated} rated game${s.rated === 1 ? '' : 's'}` : 'No ratings yet',
      icon: Star,
      color: 'var(--amber)',
    },
    {
      key: 'completion',
      label: 'Completion rate',
      value: `${completionRate.value}%`,
      sub: `${s.completed} of ${s.total} finished`,
      icon: Trophy,
      color: 'var(--green)',
    },
    {
      key: 'favorites',
      label: 'Favorites',
      value: s.favorites,
      sub: s.favorites ? 'games you love' : 'Tap ❤ on a game',
      icon: Heart,
      color: 'var(--red)',
    },
  ];
});

const toBars = (rows) => (rows ?? []).map((r) => ({ key: r.label, label: r.label, value: r.count }));
const platformBars = computed(() => toBars(stats.value?.by_platform));
const genreBars = computed(() => toBars(stats.value?.by_genre));
const playedBars = computed(() =>
  (stats.value?.most_played ?? []).map((g) => ({
    key: g.id,
    label: g.title,
    value: g.hours_played,
    display: formatHours(g.hours_played),
  })),
);

// Hover/focus tooltip for the status bar.
const hovered = ref(null);
const tooltipLeft = computed(() => {
  if (!hovered.value) return 0;
  let before = 0;
  for (const p of statusParts.value) {
    if (p.key === hovered.value.key) return before + p.share / 2;
    before += p.share;
  }
  return 0;
});
</script>

<template>
  <div class="app">
    <header class="header">
      <NuxtLink to="/" class="icon-btn" aria-label="Back to your games">
        <ArrowLeft :size="20" />
      </NuxtLink>
      <h1 class="page-title">Insights</h1>
      <ThemeToggle />
    </header>

    <main class="main">
      <!-- Loading -->
      <template v-if="loading">
        <div class="card hero skeleton-block" aria-hidden="true" />
        <div class="tiles">
          <div v-for="n in 3" :key="n" class="card tile skeleton-block" aria-hidden="true" />
        </div>
      </template>

      <!-- No games yet -->
      <EmptyState
        v-else-if="!stats?.total"
        title="No insights yet."
        message="Add a few games to see your stats here."
      >
        <NuxtLink to="/" class="btn btn-primary">Go to My Games</NuxtLink>
      </EmptyState>

      <template v-else>
        <!-- Hero: the one headline number -->
        <section class="card hero" aria-labelledby="hero-label">
          <div class="hero-icon"><Clock :size="26" /></div>
          <div>
            <p id="hero-label" class="hero-label">Total time played</p>
            <p class="hero-value">
              {{ shownHours.toLocaleString('en-US', { maximumFractionDigits: 1 }) }}
              <span class="hero-unit">hours</span>
            </p>
            <p class="hero-sub">
              <template v-if="playedGames">
                across your collection of {{ stats.total }} game{{ stats.total === 1 ? '' : 's' }}
              </template>
              <template v-else>Add “Hours played” to your games to track this.</template>
            </p>
          </div>
        </section>

        <!-- Stat tiles -->
        <section class="tiles" aria-label="Summary">
          <Motion
            v-for="(t, i) in tiles"
            :key="t.key"
            as="article"
            class="card tile"
            :style="{ '--c': t.color }"
            :initial="{ opacity: 0, y: 14 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ type: 'spring', stiffness: 260, damping: 24, delay: 0.1 + i * 0.07 }"
          >
            <div class="tile-icon"><component :is="t.icon" :size="20" /></div>
            <p class="tile-label">{{ t.label }}</p>
            <p class="tile-value">{{ t.value }}</p>
            <p class="tile-sub">{{ t.sub }}</p>
          </Motion>
        </section>

        <!-- Status mix: part-to-whole stacked bar -->
        <section class="card panel" aria-labelledby="status-title">
          <h2 id="status-title">Collection by status</h2>
          <div class="stack-wrap">
            <div
              v-if="hovered"
              class="tooltip"
              role="tooltip"
              :style="{ left: `clamp(60px, ${tooltipLeft}%, calc(100% - 60px))` }"
            >
              <strong>{{ hovered.label }}</strong>
              {{ hovered.count }} game{{ hovered.count === 1 ? '' : 's' }} · {{ hovered.pct }}%
            </div>
            <div class="stack" role="list" aria-label="Games by status">
              <template v-for="p in statusParts" :key="p.key">
                <div
                  v-if="p.count"
                  class="segment"
                  role="listitem"
                  tabindex="0"
                  :class="{ dim: hovered && hovered.key !== p.key }"
                  :style="{ flexGrow: p.count, background: `var(--chart-${p.key})` }"
                  :aria-label="`${p.label}: ${p.count} game${p.count === 1 ? '' : 's'}, ${p.pct}%`"
                  @mouseenter="hovered = p"
                  @mouseleave="hovered = null"
                  @focus="hovered = p"
                  @blur="hovered = null"
                />
              </template>
            </div>
          </div>
          <ul class="legend">
            <li
              v-for="p in statusParts"
              :key="p.key"
              :class="{ dim: hovered && hovered.key !== p.key }"
              @mouseenter="p.count && (hovered = p)"
              @mouseleave="hovered = null"
            >
              <span class="swatch" :style="{ background: `var(--chart-${p.key})` }" aria-hidden="true" />
              <span class="legend-label">{{ p.label }}</span>
              <span class="legend-value">{{ p.count }}</span>
              <span class="legend-pct">{{ p.pct }}%</span>
            </li>
          </ul>
        </section>

        <div class="two-col">
          <section class="card panel" aria-labelledby="platform-title">
            <h2 id="platform-title">Top platforms</h2>
            <p class="panel-sub">Games per platform</p>
            <BarList :items="platformBars" empty="Add a platform to your games to see this." />
          </section>
          <section class="card panel" aria-labelledby="genre-title">
            <h2 id="genre-title">Top genres</h2>
            <p class="panel-sub">Games per genre</p>
            <BarList :items="genreBars" empty="Add a genre to your games to see this." />
          </section>
        </div>

        <section class="card panel" aria-labelledby="played-title">
          <h2 id="played-title">Most played</h2>
          <p class="panel-sub">Hours played, top 5</p>
          <BarList :items="playedBars" empty="Add “Hours played” to your games to see your most played." />
        </section>
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

.page-title {
  flex: 1;
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(22px, 6vw, 30px);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--accent-soft);
}

.main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

p {
  margin: 0;
}

/* Hero */
.hero {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px 20px;
}

.hero-icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(135deg, #a78bfa, #6d28d9);
  box-shadow: 0 0 24px rgba(139, 92, 246, 0.5);
}

.hero-label {
  color: var(--text-muted);
  font-weight: 700;
}

.hero-value {
  font-family: var(--font-display);
  letter-spacing: -0.03em;
  font-size: clamp(48px, 13vw, 64px);
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.hero-unit {
  font-size: 22px;
  color: var(--text-muted);
}

.hero-sub {
  margin-top: 6px;
  color: var(--text-muted);
  font-weight: 500;
}

/* Tiles */
.tiles {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}

@media (min-width: 560px) {
  .tiles {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }
}

.tile {
  padding: 16px;
}

.tile-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin-bottom: 10px;
  border-radius: 12px;
  color: var(--c);
  background: color-mix(in srgb, var(--c) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--c) 35%, transparent);
}

.tile-label {
  color: var(--text-muted);
  font-weight: 700;
}

.tile-value {
  font-family: var(--font-display);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.1;
}

.tile-sub {
  color: var(--text-muted);
  font-size: 15px;
  font-weight: 500;
}

.skeleton-block {
  min-height: 120px;
  background: linear-gradient(90deg, var(--skeleton) 25%, var(--skeleton-shine) 50%, var(--skeleton) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

/* Panels */
.panel {
  padding: 18px 20px 20px;
}

.panel h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.panel-sub {
  margin: 2px 0 12px;
  color: var(--text-muted);
  font-size: 15px;
  font-weight: 500;
}

.two-col {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

@media (min-width: 768px) {
  .two-col {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Stacked status bar */
.stack-wrap {
  position: relative;
  margin: 44px 0 14px;
}

.stack {
  display: flex;
  gap: 2px; /* surface gap between segments */
  height: 20px;
}

.segment {
  min-width: 6px;
  outline-offset: 2px;
  transition: opacity 0.15s ease;
}

.segment:first-child {
  border-radius: 4px 0 0 4px;
}

.segment:last-child {
  border-radius: 0 4px 4px 0;
}

.segment:only-child {
  border-radius: 4px;
}

.dim {
  opacity: 0.35;
}

.tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--surface-solid);
  border: 1px solid var(--border-strong);
  box-shadow: var(--shadow);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
}

.legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 16px;
}

@media (min-width: 640px) {
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 32px;
  }

  .legend .legend-value {
    margin-left: 4px;
  }
}

.legend li {
  display: flex;
  align-items: center;
  gap: 8px;
  transition: opacity 0.15s ease;
}

.swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

.legend-label {
  font-weight: 600;
}

.legend-value {
  margin-left: auto;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.legend-pct {
  min-width: 4ch;
  text-align: right;
  color: var(--text-muted);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}
</style>
