import { Router } from 'express';
import { CATALOG } from '../data/catalog.js';
import { HttpError } from '../validate.js';

// GET /api/lookup?q=  →  games matching a title, with cover art, genre and platform,
// so the Add Game form can fill them in automatically.
// Sources: GameVault's own catalog, the Steam store, and the App Store (mobile games).

const router = Router();

const MAX_RESULTS = 8;
const STEAM_DETAILS = 6; // Steam lookups per search (each is one extra request)
const CACHE_MS = 60 * 60 * 1000;
const TIMEOUT_MS = 5000;

// Genres the app knows about (see frontend/app/utils/constants.js).
const GENRE_MAP = {
  action: 'Action',
  adventure: 'Adventure',
  rpg: 'RPG',
  'role playing': 'RPG',
  strategy: 'Strategy',
  simulation: 'Simulation',
  sports: 'Sports',
  racing: 'Racing',
  puzzle: 'Puzzle',
};

const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const mapGenre = (names) => names.map((n) => GENRE_MAP[norm(n)]).find(Boolean) ?? null;

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function exists(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(TIMEOUT_MS) });
    return res.ok;
  } catch {
    return false;
  }
}

function searchCatalog(q) {
  const nq = norm(q);
  return CATALOG.filter((g) => norm(g.title).includes(nq)).map((g) => ({
    title: g.title,
    cover_url: g.cover_url,
    genre: g.genre,
    platform: g.platforms[0],
    year: g.year,
    source: 'GameVault',
  }));
}

async function searchSteam(q) {
  const data = await getJson(
    `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=english&cc=PH`,
  );
  const items = (data.items || []).filter((i) => i.type === 'app').slice(0, STEAM_DETAILS);

  const results = await Promise.all(
    items.map(async (item) => {
      try {
        const details = await getJson(
          `https://store.steampowered.com/api/appdetails?appids=${item.id}&filters=basic,genres,release_date`,
        );
        const d = details?.[item.id]?.data;
        if (!d || d.type !== 'game') return null; // skip DLC, soundtracks, demos

        // Tall "library" art suits the vault card; fall back to the wide header.
        const portrait = `https://cdn.cloudflare.steamstatic.com/steam/apps/${item.id}/library_600x900.jpg`;
        const cover_url = (await exists(portrait)) ? portrait : d.header_image;
        const year = Number(/\d{4}/.exec(d.release_date?.date ?? '')?.[0]) || null;

        return {
          title: d.name,
          cover_url,
          genre: mapGenre((d.genres || []).map((g) => g.description)),
          platform: 'PC',
          year,
          source: 'Steam',
        };
      } catch {
        return null;
      }
    }),
  );
  return results.filter(Boolean);
}

async function searchAppStore(q) {
  const data = await getJson(
    `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=software&limit=10&country=ph`,
  );
  // App Store search is very fuzzy, so keep only titles containing every word typed.
  const words = norm(q).split(' ');
  return (data.results || [])
    .filter((r) => r.primaryGenreId === 6014) // Games only
    .filter((r) => {
      const title = ` ${norm(r.trackName)} `;
      return words.every((w) => title.includes(` ${w}`));
    })
    .slice(0, 4)
    .map((r) => ({
      title: r.trackName,
      cover_url: r.artworkUrl512?.replace(/\/[^/]+$/, '/600x600bb.jpg') ?? null,
      genre: mapGenre(r.genres || []),
      platform: null, // usually on both Android and iOS; let the user choose
      year: Number(r.releaseDate?.slice(0, 4)) || null,
      source: 'App Store',
    }));
}

const cache = new Map(); // normalized query -> { at, results }

router.get('/', async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q.length < 2) return res.json({ results: [] });
    if (q.length > 100) throw new HttpError(400, 'Search is too long');

    const key = norm(q);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return res.json({ results: hit.results });

    // A failing source just contributes nothing.
    const [steam, appStore] = await Promise.all([
      searchSteam(q).catch(() => []),
      searchAppStore(q).catch(() => []),
    ]);

    // Catalog first (richest info), then Steam, then App Store; one entry per title.
    const seen = new Set();
    const results = [];
    for (const r of [...searchCatalog(q), ...steam, ...appStore]) {
      const k = norm(r.title);
      if (!r.cover_url || seen.has(k)) continue;
      seen.add(k);
      results.push(r);
      if (results.length === MAX_RESULTS) break;
    }

    if (cache.size > 500) cache.clear();
    cache.set(key, { at: Date.now(), results });
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

export default router;
