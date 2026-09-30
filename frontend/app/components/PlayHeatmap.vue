<script setup>
import { formatDuration } from '~/utils/constants';

// GitHub-style grid of play time per day over the last N weeks.
// One hue, four steps (more play = stronger purple); the legend and tooltips carry the values.
const props = defineProps({
  weeks: { type: Number, default: 15 },
});

const api = useApi();
const { version } = useSession();

const days = ref([]);
const loading = ref(true);
const error = ref('');

async function load() {
  error.value = '';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    ({ days: days.value } = await api.getHeatmap({ weeks: props.weeks, tz }));
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
// Client only: the grid depends on the viewer's time zone.
onMounted(load);
watch(version, load); // new play time logged

// Minutes -> intensity level. Fixed steps so the legend can say what they mean.
const LEVELS = [
  { max: 0, label: 'No play' },
  { max: 29, label: 'Under 30m' },
  { max: 59, label: '30m to 1h' },
  { max: 119, label: '1 to 2h' },
  { max: Infinity, label: '2h or more' },
];
const levelOf = (minutes) => LEVELS.findIndex((l) => minutes <= l.max);

const parse = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const dayLabel = (iso) => parse(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

// Columns of 7 (Sunday first), padded at the start so rows line up with weekdays.
const columns = computed(() => {
  if (!days.value.length) return [];
  const pad = parse(days.value[0].date).getDay();
  const cells = [...Array(pad).fill(null), ...days.value];
  const cols = [];
  for (let i = 0; i < cells.length; i += 7) cols.push(cells.slice(i, i + 7));
  return cols;
});

// Month name over the first column of each month (skipped if there's no room for it).
const monthLabels = computed(() => {
  const labels = [];
  let prev = null;
  columns.value.forEach((col, i) => {
    const first = col.find(Boolean);
    const month = parse(first.date).getMonth();
    if (month !== prev) {
      const last = labels[labels.length - 1];
      if (!last || i - last.col >= 3) labels.push({ col: i, text: parse(first.date).toLocaleDateString('en-US', { month: 'short' }) });
      prev = month;
    }
  });
  return labels;
});

const totalMinutes = computed(() => days.value.reduce((sum, d) => sum + d.minutes, 0));
const activeDays = computed(() => days.value.filter((d) => d.minutes > 0).length);
// Consecutive days with play, ending today (or yesterday, if today hasn't started yet).
const streak = computed(() => {
  const list = days.value;
  let i = list.length - 1;
  if (i >= 0 && !list[i].minutes) i--;
  let n = 0;
  while (i >= 0 && list[i].minutes > 0) {
    n++;
    i--;
  }
  return n;
});
const summary = computed(() =>
  totalMinutes.value
    ? `${formatDuration(totalMinutes.value)} over ${activeDays.value} day${activeDays.value === 1 ? '' : 's'} in the last ${props.weeks} weeks`
    : `Start a play session from any game and your activity shows up here.`,
);

// Tooltip: hover on desktop, tap on touch screens.
// Cell size: 14px on phones, 18px on wider screens.
const CELL = ref(14);
const GAP = 3;
onMounted(() => {
  if (window.matchMedia('(min-width: 768px)').matches) CELL.value = 18;
});
const hovered = ref(null);
function show(day, col, row) {
  if (!day) return (hovered.value = null);
  // Top rows: put the tooltip below the cell so the scroll area doesn't clip it.
  const below = row < 2;
  // Keep it inside the grid horizontally (about 80px each side of its center).
  const size = CELL.value + GAP;
  const width = columns.value.length * size;
  const center = col * size + CELL.value / 2;
  hovered.value = {
    ...day,
    below,
    left: Math.min(Math.max(center, 80), Math.max(width - 80, 80)),
    top: below ? (row + 1) * size + 4 : row * size,
  };
}

// Newest days are on the right; start scrolled there on narrow screens.
const scroller = ref(null);
watch(columns, async () => {
  await nextTick();
  if (scroller.value) scroller.value.scrollLeft = scroller.value.scrollWidth;
});
</script>

<template>
  <section class="card heatmap" aria-labelledby="hm-title">
    <div class="hm-head">
      <div class="hm-heading">
        <h2 id="hm-title">Play activity</h2>
        <p class="hm-sub">{{ loading ? 'Loading your sessions...' : summary }}</p>
      </div>
      <span v-if="streak >= 2" class="streak" :title="`You played ${streak} days in a row`">
        🔥 {{ streak }}-day streak
      </span>
    </div>

    <div v-if="loading" class="skeleton hm-skeleton" aria-hidden="true" />

    <p v-else-if="error" class="form-alert form-alert-error hm-error" role="alert">
      Couldn't load your activity. <button type="button" class="link retry" @click="load">Try again</button>
    </p>

    <template v-else>
      <div ref="scroller" class="hm-scroll">
        <div class="hm-wrap" :style="{ '--cell': `${CELL}px`, '--gap': `${GAP}px` }">
          <div class="hm-months" aria-hidden="true">
            <span
              v-for="m in monthLabels"
              :key="m.col"
              class="hm-month"
              :style="{ left: `${m.col * (CELL + GAP)}px` }"
            >{{ m.text }}</span>
          </div>
          <div class="hm-body">
            <div class="hm-weekdays" aria-hidden="true">
              <span />
              <span>Mon</span>
              <span />
              <span>Wed</span>
              <span />
              <span>Fri</span>
              <span />
            </div>
            <div class="hm-grid" aria-hidden="true" @mouseleave="hovered = null">
              <div v-for="(col, c) in columns" :key="c" class="hm-col">
                <span
                  v-for="(day, r) in col"
                  :key="day ? day.date : `pad-${r}`"
                  class="hm-cell"
                  :class="day ? `lvl-${levelOf(day.minutes)}` : 'pad'"
                  @mouseenter="show(day, c, r)"
                  @click="show(day, c, r)"
                />
              </div>
              <div
                v-if="hovered"
                class="hm-tip"
                :class="{ below: hovered.below }"
                :style="{ left: `${hovered.left}px`, top: `${hovered.top}px` }"
              >
                <strong>{{ dayLabel(hovered.date) }}</strong>
                · {{ hovered.minutes ? formatDuration(hovered.minutes) : 'No play' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="hm-legend" aria-hidden="true">
        <span>Less</span>
        <span v-for="(l, i) in LEVELS" :key="i" class="hm-cell" :class="`lvl-${i}`" :title="l.label" />
        <span>More</span>
      </div>

      <p class="sr-only">
        {{ summary }}.
        <template v-if="streak >= 2">Current streak: {{ streak }} days.</template>
      </p>
    </template>
  </section>
</template>

<style scoped>
.heatmap {
  padding: 16px 18px;
  min-width: 0;
}

.hm-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.hm-heading {
  min-width: 0;
}

h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.hm-sub {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-size: 15px;
  font-weight: 500;
}

.streak {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--amber) 45%, transparent);
  background: color-mix(in srgb, var(--amber) 12%, transparent);
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.hm-skeleton {
  height: 150px;
}

.hm-error {
  margin: 0;
}

.retry {
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
}

.hm-scroll {
  overflow-x: auto;
  scrollbar-width: thin;
  padding-bottom: 4px;
}

.hm-wrap {
  width: max-content;
  margin: 0 auto;
}

.hm-months {
  position: relative;
  height: 18px;
  margin-left: 34px; /* weekday labels */
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
}

.hm-month {
  position: absolute;
  top: 0;
  white-space: nowrap;
}

.hm-body {
  display: flex;
  gap: 6px;
}

.hm-weekdays {
  display: grid;
  grid-template-rows: repeat(7, var(--cell));
  gap: var(--gap);
  width: 28px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  line-height: var(--cell);
}

.hm-grid {
  position: relative;
  display: flex;
  gap: var(--gap);
}

.hm-col {
  display: grid;
  grid-template-rows: repeat(7, var(--cell));
  gap: var(--gap);
}

.hm-cell {
  width: var(--cell, 14px);
  height: var(--cell, 14px);
  border-radius: 3px;
}

.hm-cell.pad {
  visibility: hidden;
}

/* One hue, lighter -> stronger. */
.lvl-0 { background: var(--surface-2); box-shadow: inset 0 0 0 1px var(--border); }
.lvl-1 { background: color-mix(in srgb, var(--accent) 30%, var(--surface-solid)); }
.lvl-2 { background: color-mix(in srgb, var(--accent) 52%, var(--surface-solid)); }
.lvl-3 { background: color-mix(in srgb, var(--accent) 76%, var(--surface-solid)); }
.lvl-4 { background: var(--accent); }

.hm-grid .hm-cell:not(.pad) {
  cursor: pointer;
}

.hm-grid .hm-cell:not(.pad):hover {
  outline: 2px solid var(--text);
  outline-offset: 1px;
}

.hm-tip {
  position: absolute;
  transform: translate(-50%, calc(-100% - 8px));
  z-index: 5;
  padding: 5px 10px;
  border-radius: 8px;
  background: var(--surface-solid);
  border: 1px solid var(--border-strong);
  box-shadow: var(--shadow);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
}

.hm-tip.below {
  transform: translate(-50%, 0);
}

.hm-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 10px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
}

.hm-legend .hm-cell {
  --cell: 12px;
}
</style>
