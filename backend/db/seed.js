import { sql } from '../src/db.js';

const games = [
  {
    title: 'The Legend of Zelda: Tears of the Kingdom',
    platform: 'Nintendo Switch',
    genre: 'Action-Adventure',
    status: 'completed',
    favorite: true,
    rating: 5,
    hours_played: 142,
    cover_url: 'https://upload.wikimedia.org/wikipedia/en/f/fb/The_Legend_of_Zelda_Tears_of_the_Kingdom_cover.jpg',
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

// Usage: npm run db:seed [-- --email you@example.com] [-- --force]
// Seeds the games into that account (default: the oldest account).
const args = process.argv.slice(2);
const force = args.includes('--force');
const emailArg = args[args.indexOf('--email') + 1];
const email = args.includes('--email') && emailArg ? emailArg.toLowerCase() : null;

const [user] = email
  ? await sql`SELECT id, email FROM users WHERE lower(email) = ${email}`
  : await sql`SELECT id, email FROM users ORDER BY id LIMIT 1`;
if (!user) {
  console.log(email ? `No account found for ${email}.` : 'No accounts yet. Create one in the app first, then run the seed.');
  process.exit(1);
}

const [{ count }] = await sql`SELECT count(*)::int AS count FROM games WHERE user_id = ${user.id}`;

if (count > 0 && !force) {
  console.log(`${user.email} already has ${count} games, skipping seed. Add "-- --force" to wipe and reseed.`);
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
