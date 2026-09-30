import { Router } from 'express';
import { sql } from '../db.js';
import { HttpError, STATUSES, parseId, requestTimeZone, validateGame } from '../validate.js';
import { evaluateAchievements } from '../achievements.js';

const router = Router();

// ?sort= options. Only these fixed strings are ever put into the SQL.
const SORTS = {
  newest: 'created_at DESC, id DESC',
  oldest: 'created_at ASC, id ASC',
  title: 'lower(title) ASC, id ASC',
  rating: 'rating DESC NULLS LAST, created_at DESC',
  hours: 'hours_played DESC NULLS LAST, created_at DESC',
};

// Express 4 does not catch rejected promises, so forward them to the error handler.
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// GET /api/games?q=&status=&favorite=1&sort=
router.get('/', wrap(async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';

  if (status && !STATUSES.includes(status)) {
    throw new HttpError(400, `status must be one of: ${STATUSES.join(', ')}`);
  }
  const sort = typeof req.query.sort === 'string' && req.query.sort ? req.query.sort : 'newest';
  if (!Object.hasOwn(SORTS, sort)) {
    throw new HttpError(400, `sort must be one of: ${Object.keys(SORTS).join(', ')}`);
  }

  const params = [req.userId];
  const where = ['user_id = $1'];
  if (q) {
    // Escape LIKE wildcards so the search text is matched literally.
    params.push(`%${q.replace(/[\\%_]/g, '\\$&')}%`);
    where.push(`title ILIKE $${params.length}`);
  }
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (req.query.favorite === '1' || req.query.favorite === 'true') {
    where.push('favorite');
  }

  const games = await sql.query(
    `SELECT * FROM games WHERE ${where.join(' AND ')} ORDER BY ${SORTS[sort]}`,
    params,
  );
  res.json(games);
}));

router.get('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const [game] = await sql`SELECT * FROM games WHERE id = ${id} AND user_id = ${req.userId}`;
  if (!game) throw new HttpError(404, 'Game not found');
  res.json(game);
}));

router.post('/', wrap(async (req, res) => {
  const g = validateGame(req.body);
  const [game] = await sql`
    INSERT INTO games (user_id, title, platform, genre, status, favorite, rating, hours_played, cover_url, notes)
    VALUES (
      ${req.userId}, ${g.title}, ${g.platform ?? null}, ${g.genre ?? null}, ${g.status ?? 'backlog'},
      ${g.favorite ?? false}, ${g.rating ?? null}, ${g.hours_played ?? null}, ${g.cover_url ?? null}, ${g.notes ?? null}
    )
    RETURNING *
  `;
  const achievements_unlocked = await evaluateAchievements(req.userId, requestTimeZone(req));
  res.status(201).json({ ...game, achievements_unlocked });
}));

router.patch('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const updates = validateGame(req.body, { partial: true });
  const fields = Object.keys(updates);
  if (!fields.length) throw new HttpError(400, 'No valid fields to update');

  // Column names come from the FIELDS whitelist; values are bound parameters.
  const sets = fields.map((f, i) => `${f} = $${i + 1}`);
  const params = [...fields.map((f) => updates[f]), id, req.userId];
  const [game] = await sql.query(
    `UPDATE games SET ${sets.join(', ')} WHERE id = $${params.length - 1} AND user_id = $${params.length} RETURNING *`,
    params,
  );
  if (!game) throw new HttpError(404, 'Game not found');
  // Only status and genre changes can unlock anything here.
  const achievements_unlocked =
    'status' in updates || 'genre' in updates ? await evaluateAchievements(req.userId, requestTimeZone(req)) : [];
  res.json({ ...game, achievements_unlocked });
}));

router.delete('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const [game] = await sql`DELETE FROM games WHERE id = ${id} AND user_id = ${req.userId} RETURNING id`;
  if (!game) throw new HttpError(404, 'Game not found');
  res.status(204).end();
}));

export default router;
