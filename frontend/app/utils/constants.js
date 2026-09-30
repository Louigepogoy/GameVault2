export const STATUSES = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'playing', label: 'Playing' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
];

export const STATUS_LABELS = Object.fromEntries(STATUSES.map((s) => [s.value, s.label]));

export const PLATFORMS = [
  'PC',
  'PlayStation 5',
  'PlayStation 4',
  'Xbox Series X|S',
  'Xbox One',
  'Nintendo Switch',
  'Steam Deck',
  'iOS',
  'Android',
];

export const GENRES = [
  'Action',
  'Action-Adventure',
  'Action RPG',
  'Adventure',
  'Fighting',
  'Horror',
  'Metroidvania',
  'MOBA',
  'Party',
  'Platformer',
  'Puzzle',
  'Racing',
  'Roguelike',
  'RPG',
  'Sandbox',
  'Shooter',
  'Simulation',
  'Sports',
  'Strategy',
];

export const SORTS = [
  { value: 'newest', label: 'Sort: Newest' },
  { value: 'oldest', label: 'Sort: Oldest' },
  { value: 'title', label: 'Sort: Title A–Z' },
  { value: 'rating', label: 'Sort: Top rated' },
  { value: 'hours', label: 'Sort: Most played' },
];

export const SORT_VALUES = SORTS.map((s) => s.value);

/** 42 -> "42h", 12.5 -> "12.5h", 1234 -> "1,234h" */
export function formatHours(hours) {
  const n = Number(hours) || 0;
  return `${n.toLocaleString('en-US', { maximumFractionDigits: 1 })}h`;
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const UNITS = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "just now", "5 minutes ago", "yesterday", "3 weeks ago" */
export function timeAgo(date) {
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  if (!Number.isFinite(seconds)) return '';
  if (Math.abs(seconds) < 60) return 'just now';
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}
