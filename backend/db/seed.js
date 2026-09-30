import { sql } from '../src/db.js';
import { evaluateAchievements } from '../src/achievements.js';

const games = [
  {
    title: 'The Legend of Zelda: Tears of the Kingdom',
    platform: 'Nintendo Switch',
    genre: 'Action-Adventure',
    status: 'completed',
    favorite: true,
    rating: 5,
    hours_played: 142,
    cover_url:
      'https://upload.wikimedia.org/wikipedia/en/f/fb/The_Legend_of_Zelda_Tears_of_the_Kingdom_cover.jpg',
    notes: 'Ultrahand builds are endless fun.',
  },
  {
    title: 'Elden Ring',
    platform: 'PC',
    genre: 'Action RPG',
    status: 'playing',
    favorite: true,
    rating: 5,
    hours_played: 96.5,
    cover_url: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Elden_Ring_Box_art.jpg',
    notes: 'Currently stuck on Malenia.',
  },
  {
    title: 'Hades',
    platform: 'PC',
    genre: 'Roguelike',
    status: 'completed',
    favorite: true,
    rating: 5,
    hours_played: 88,
    cover_url: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Hades_cover_art.jpg',
    notes: 'Got the true ending.',
  },
  {
    title: 'Cyberpunk 2077',
    platform: 'PlayStation 5',
    genre: 'RPG',
    status: 'backlog',
    favorite: false,
    rating: null,
    hours_played: null,
    cover_url: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Cyberpunk_2077_box_art.jpg',
    notes: 'Waiting to play with Phantom Liberty.',
  },
  {
    title: 'Stardew Valley',
    platform: 'Nintendo Switch',
    genre: 'Simulation',
    status: 'playing',
    favorite: false,
    rating: 4,
    hours_played: 63,
    cover_url: null,
    notes: 'Year 3, working on the Community Center.',
  },
  {
    title: 'Hollow Knight',
    platform: 'PC',
    genre: 'Metroidvania',
    status: 'dropped',
    favorite: false,
    rating: 3,
    hours_played: 11.5,
    cover_url: null,
    notes: 'Too hard for now, will retry later.',
  },
  {
    title: 'God of War Ragnarök',
    platform: 'PlayStation 5',
    genre: 'Action-Adventure',
    status: 'completed',
    favorite: false,
    rating: 4,
    hours_played: 34,
    cover_url: 'https://upload.wikimedia.org/wikipedia/en/e/ee/God_of_War_Ragnar%C3%B6k_cover.jpg',
    notes: null,
  },
  {
    title: "Baldur's Gate 3",
    platform: 'PC',
    genre: 'CRPG',
    status: 'backlog',
    favorite: true,
    rating: null,
    hours_played: null,
    cover_url: null,
    notes: 'Planning a co-op run.',
  },
];

// Usage: npm run db:seed [-- --email you@example.com] [-- --force] [-- --tz Asia/Manila]
// Seeds the games into that account (default: the oldest account).
const args = process.argv.slice(2);
const force = args.includes('--force');
const emailArg = args[args.indexOf('--email') + 1];
const email = args.includes('--email') && emailArg ? emailArg.toLowerCase() : null;
// Time zone for the sample sessions, so "evening" means evening where you are.
const tz = args.includes('--tz') ? args[args.indexOf('--tz') + 1] : 'Asia/Manila';

const [user] = email
  ? await sql`SELECT id, email FROM users WHERE lower(email) = ${email}`
  : await sql`SELECT id, email FROM users ORDER BY id LIMIT 1`;
if (!user) {
  console.log(
    email
      ? `No account found for ${email}.`
      : 'No accounts yet. Create one in the app first, then run the seed.',
  );
  process.exit(1);
}

const [{ count }] = await sql`SELECT count(*)::int AS count FROM games WHERE user_id = ${user.id}`;

if (count > 0 && !force) {
  console.log(
    `${user.email} already has ${count} games, skipping seed. Add "-- --force" to wipe and reseed.`,
  );
  process.exit(0);
}
if (count > 0) await sql`DELETE FROM games WHERE user_id = ${user.id}`;

// Insert oldest-first so the list (newest first) shows them in array order.
for (const g of [...games].reverse()) {
  await sql`
    INSERT INTO games (user_id, title, platform, genre, status, favorite, rating, hours_played, cover_url, notes)
    VALUES (${user.id}, ${g.title}, ${g.platform}, ${g.genre}, ${g.status}, ${g.favorite}, ${g.rating}, ${g.hours_played}, ${g.cover_url}, ${g.notes})
  `;
}
console.log(`Seeded ${games.length} games for ${user.email}.`);

// ---------- Sample play sessions (last 15 weeks) ----------
// Evenings mostly, some weekend marathons, one late-night session, and gaps, so the
// heatmap and session history look like a real person played. Deterministic, so every
// seed looks the same.
let state = 42;
const rand = () => (state = (state * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
const NOTES = [
  'Beat a tough boss!',
  'Explored a new area',
  'Grinding levels',
  'Finished a side quest',
  null,
  null,
  null,
];

const played = await sql`
  SELECT id, status FROM games
  WHERE user_id = ${user.id} AND status IN ('playing', 'completed', 'dropped')
  ORDER BY id
`;
const sessions = [];
for (let daysAgo = 104; daysAgo >= 1; daysAgo--) {
  const lateNight = daysAgo === 12; // always one 1 AM session (for the Night Owl achievement)
  if (!lateNight && rand() < 0.55) continue; // not every day
  const weekend = [0, 6].includes(new Date(Date.now() - daysAgo * 864e5).getDay());
  const game = played[Math.floor(rand() * played.length)];
  const minutes = Math.round((weekend ? 60 + rand() * 180 : 20 + rand() * 90) / 5) * 5;
  const startHour = lateNight ? 1 : weekend ? 13 + Math.floor(rand() * 6) : 19 + Math.floor(rand() * 3);
  sessions.push({
    game: game.id,
    daysAgo,
    startHour,
    minutes,
    note: NOTES[Math.floor(rand() * NOTES.length)],
  });
}
for (const x of sessions) {
  await sql`
    INSERT INTO play_sessions (user_id, game_id, started_at, ended_at, duration_minutes, note)
    VALUES (
      ${user.id}, ${x.game},
      (date_trunc('day', now() AT TIME ZONE ${tz}) - make_interval(days => ${x.daysAgo}) + make_interval(hours => ${x.startHour})) AT TIME ZONE ${tz},
      (date_trunc('day', now() AT TIME ZONE ${tz}) - make_interval(days => ${x.daysAgo}) + make_interval(hours => ${x.startHour}, mins => ${x.minutes})) AT TIME ZONE ${tz},
      ${x.minutes}, ${x.note}
    )
  `;
}
console.log(`Seeded ${sessions.length} play sessions.`);

// Unlock whatever the sample data earns (e.g. First Steps, Night Owl, Marathon).
const unlocked = await evaluateAchievements(user.id, tz);
console.log(
  `Unlocked ${unlocked.length} achievements: ${unlocked.map((x) => x.title).join(', ') || 'none'}.`,
);
