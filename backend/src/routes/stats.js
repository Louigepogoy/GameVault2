import { Router } from 'express';
import { sql } from '../db.js';

const router = Router();

const TOP_N = 6;

// GET /api/stats
router.get('/', async (req, res, next) => {
  try {
    const uid = req.userId;
    const [[totals], byStatus, byPlatform, byGenre, mostPlayed] = await Promise.all([
      sql`
        SELECT
          count(*)::int                                     AS total,
          count(*) FILTER (WHERE favorite)::int             AS favorites,
          count(*) FILTER (WHERE status = 'completed')::int AS completed,
          count(*) FILTER (WHERE status = 'playing')::int   AS playing,
          count(*) FILTER (WHERE status = 'backlog')::int   AS backlog,
          round(coalesce(sum(hours_played::numeric), 0), 1)::float8 AS hours,
          round(avg(rating)::numeric, 1)::float8            AS avg_rating,
          count(rating)::int                                AS rated
        FROM games
        WHERE user_id = ${uid}
      `,
      sql`
        SELECT status AS label, count(*)::int AS count
        FROM games WHERE user_id = ${uid}
        GROUP BY status
      `,
      sql`
        SELECT platform AS label, count(*)::int AS count
        FROM games WHERE user_id = ${uid} AND platform IS NOT NULL
        GROUP BY platform ORDER BY count DESC, platform LIMIT ${TOP_N}
      `,
      sql`
        SELECT genre AS label, count(*)::int AS count
        FROM games WHERE user_id = ${uid} AND genre IS NOT NULL
        GROUP BY genre ORDER BY count DESC, genre LIMIT ${TOP_N}
      `,
      sql`
        SELECT id, title, platform, cover_url, hours_played
        FROM games WHERE user_id = ${uid} AND hours_played > 0
        ORDER BY hours_played DESC, title LIMIT 5
      `,
    ]);

    res.json({ ...totals, by_status: byStatus, by_platform: byPlatform, by_genre: byGenre, most_played: mostPlayed });
  } catch (err) {
    next(err);
  }
});

export default router;
