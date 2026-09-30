import { Router } from 'express';
import { sql } from '../db.js';
import { parseIntParam, validateTimeZone } from '../validate.js';

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

// GET /api/stats/heatmap?weeks=15&tz=Asia/Manila
// -> { days: [{ date: 'YYYY-MM-DD', minutes }], tz, weeks }
// One entry per day (zeros included), oldest first, ending today in the user's time zone.
// A session counts toward the day it started on.
router.get('/heatmap', async (req, res, next) => {
  try {
    const weeks = parseIntParam(req.query.weeks, { min: 1, max: 53, fallback: 15, name: 'weeks' });
    const tz = validateTimeZone(req.query.tz);
    const days = weeks * 7;

    const rows = await sql`
      WITH today AS (SELECT (now() AT TIME ZONE ${tz})::date AS d),
      days AS (
        SELECT generate_series((SELECT d FROM today) - (${days}::int - 1), (SELECT d FROM today), interval '1 day')::date AS d
      )
      SELECT to_char(days.d, 'YYYY-MM-DD') AS date, COALESCE(sum(s.duration_minutes), 0)::int AS minutes
      FROM days
      LEFT JOIN play_sessions s
        ON s.user_id = ${req.userId}
       AND s.ended_at IS NOT NULL
       AND (s.started_at AT TIME ZONE ${tz})::date = days.d
      GROUP BY days.d
      ORDER BY days.d
    `;
    res.json({ days: rows, tz, weeks });
  } catch (err) {
    // A name JS accepts but Postgres doesn't know.
    if (err.code === '22023') return res.status(400).json({ error: `Unknown time zone: ${req.query.tz}` });
    next(err);
  }
});

export default router;
