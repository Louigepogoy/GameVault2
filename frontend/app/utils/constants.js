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
