import { Router } from 'express';
import { sql } from '../db.js';
import { CATALOG } from '../data/catalog.js';
import { currentHeader, watchSteamArt } from '../data/steamArt.js';
import { catalogLaunch } from '../launch.js';

const router = Router();

const RECOMMEND_COUNT = 6;

// No live Steam lookups during tests.
if (process.env.NODE_ENV !== 'test') watchSteamArt(CATALOG.filter((g) => g.steamId).map((g) => g.steamId));

const norm = (s) => (s || '').trim().toLowerCase();

// GET /api/discover
// The curated catalog, marked with what's already in the user's vault, plus
// recommendations based on the genres the user plays and rates highly.
router.get('/', async (req, res, next) => {
  try {
    const [games, [prefs]] = await Promise.all([
      sql`SELECT title, genre, rating, favorite FROM games WHERE user_id = ${req.userId}`,
      sql`SELECT favorite_genres FROM users WHERE id = ${req.userId}`,
    ]);

    const owned = new Set(games.map((g) => norm(g.title)));

    // Weight each genre: every game counts, favorites and high ratings count more.
    const genreWeight = new Map();
    for (const g of games) {
      const genre = norm(g.genre);
      if (!genre) continue;
      const weight = 1 + (g.favorite ? 1 : 0) + (g.rating >= 4 ? 1 : 0);
      genreWeight.set(genre, (genreWeight.get(genre) || 0) + weight);
    }
    // Genres picked during onboarding count too, so new users get suggestions right away.
    for (const g of prefs?.favorite_genres ?? []) {
      genreWeight.set(norm(g), (genreWeight.get(norm(g)) || 0) + 2);
    }

    const items = CATALOG.map((item) => {
      // The best matching genre among the item's tags explains the recommendation.
      let reason = null;
      let score = 0;
      for (const tag of item.tags) {
        const w = genreWeight.get(norm(tag)) || 0;
        if (w > score) {
          score = w;
          reason = tag;
        }
      }
      const { steamId, ...rest } = item; // internal only
      const image_url = (steamId && currentHeader(steamId)) || item.image_url;
      return {
        ...rest,
        image_url,
        launch: catalogLaunch(item),
        in_vault: owned.has(norm(item.title)),
        match: reason,
        score,
      };
    });

    const recommended = items
      .filter((i) => !i.in_vault && i.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, RECOMMEND_COUNT)
      .map((i) => i.slug);

    res.json({ games: items.map(({ score, ...i }) => i), recommended });
  } catch (err) {
    next(err);
  }
});

export default router;
