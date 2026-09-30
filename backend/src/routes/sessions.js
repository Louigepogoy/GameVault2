import { Router } from 'express';
import { sql } from '../db.js';
import { HttpError, parseId, parseIntParam, validateNote } from '../validate.js';

const router = Router();

// Express 4 does not catch rejected promises, so forward them to the error handler.
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// A forgotten timer shouldn't add days of playtime.
const MAX_SESSION_MINUTES = 24 * 60;

const body = (req) => (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {});

// Session row + the game's title/cover, which every screen that shows a session needs.
const SESSION_COLUMNS = `
  s.id, s.game_id, s.started_at, s.ended_at, s.duration_minutes, s.note,
  g.title AS game_title, g.cover_url AS game_cover_url, g.platform AS game_platform
`;

// started_at comes from the database clock, so "now" must too (the API server's clock
// can differ by seconds). The browser uses it to correct for its own clock.
const dbNow = async () => (await sql`SELECT now() AS now`)[0].now;

// GET /api/sessions/active -> { session | null, now }
router.get('/active', wrap(async (req, res) => {
  const [[session], now] = await Promise.all([
    sql.query(
      `SELECT ${SESSION_COLUMNS} FROM play_sessions s JOIN games g ON g.id = s.game_id
       WHERE s.user_id = $1 AND s.ended_at IS NULL`,
      [req.userId],
    ),
    dbNow(),
  ]);
  res.json({ session: session ?? null, now });
}));

// POST /api/sessions/start { game_id }
router.post('/start', wrap(async (req, res) => {
  const gameId = parseId(body(req).game_id);

  const [game] = await sql`SELECT id, status FROM games WHERE id = ${gameId} AND user_id = ${req.userId}`;
  if (!game) throw new HttpError(404, 'Game not found');

  let session;
  try {
    [session] = await sql`
      INSERT INTO play_sessions (user_id, game_id) VALUES (${req.userId}, ${gameId})
      RETURNING id
    `;
  } catch (err) {
    // The partial unique index allows only one running session per user.
    if (err.code === '23505') throw new HttpError(409, 'You already have a session running. Stop it first.');
    throw err;
  }

  // Starting a session on a backlog or dropped game means you're playing it now.
  if (game.status === 'backlog' || game.status === 'dropped') {
    await sql`UPDATE games SET status = 'playing' WHERE id = ${gameId} AND user_id = ${req.userId}`;
  }

  const [full] = await sql.query(
    `SELECT ${SESSION_COLUMNS} FROM play_sessions s JOIN games g ON g.id = s.game_id WHERE s.id = $1`,
    [session.id],
  );
  res.status(201).json({ session: full, now: await dbNow() });
}));

// POST /api/sessions/:id/stop { note? }
// Ends the session and adds its time to the game's hours_played in one statement,
// so the two can't get out of sync.
router.post('/:id/stop', wrap(async (req, res) => {
  const id = parseId(req.params.id, 'session');
  const note = validateNote(body(req).note);

  const [row] = await sql`
    WITH ended AS (
      UPDATE play_sessions
      SET ended_at = now(),
          duration_minutes = LEAST(${MAX_SESSION_MINUTES}, FLOOR(EXTRACT(EPOCH FROM now() - started_at) / 60))::int,
          note = COALESCE(${note}, note)
      WHERE id = ${id} AND user_id = ${req.userId} AND ended_at IS NULL
      RETURNING *
    ), game AS (
      UPDATE games
      SET hours_played = LEAST(100000, ROUND((COALESCE(hours_played, 0) + (SELECT duration_minutes FROM ended) / 60.0)::numeric, 1))::real
      WHERE id = (SELECT game_id FROM ended) AND user_id = ${req.userId}
      RETURNING id, title, hours_played
    )
    SELECT ended.id, ended.game_id, ended.started_at, ended.ended_at, ended.duration_minutes, ended.note,
           game.title AS game_title, game.hours_played AS game_hours_played
    FROM ended JOIN game ON game.id = ended.game_id
  `;
  if (!row) throw new HttpError(404, 'No running session with that id');
  res.json({ session: row });
}));

// PATCH /api/sessions/:id { note } -> add or change the note after stopping.
router.patch('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id, 'session');
  const note = validateNote(body(req).note);
  const [session] = await sql`
    UPDATE play_sessions SET note = ${note}
    WHERE id = ${id} AND user_id = ${req.userId}
    RETURNING id, game_id, started_at, ended_at, duration_minutes, note
  `;
  if (!session) throw new HttpError(404, 'Session not found');
  res.json({ session });
}));

// DELETE /api/sessions/:id -> discard a running session (started by mistake); no time is added.
router.delete('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id, 'session');
  const [session] = await sql`
    DELETE FROM play_sessions WHERE id = ${id} AND user_id = ${req.userId} AND ended_at IS NULL RETURNING id
  `;
  if (!session) throw new HttpError(404, 'No running session with that id');
  res.status(204).end();
}));

// GET /api/sessions?game_id=&page=1&limit=10 -> finished sessions, newest first.
router.get('/', wrap(async (req, res) => {
  const gameId = req.query.game_id === undefined ? null : parseId(req.query.game_id);
  const page = parseIntParam(req.query.page, { min: 1, max: 10000, fallback: 1, name: 'page' });
  const limit = parseIntParam(req.query.limit, { min: 1, max: 50, fallback: 10, name: 'limit' });

  const params = [req.userId];
  let where = 's.user_id = $1 AND s.ended_at IS NOT NULL';
  if (gameId) {
    params.push(gameId);
    where += ` AND s.game_id = $${params.length}`;
  }

  const [[{ total, total_minutes }], sessions] = await Promise.all([
    sql.query(
      `SELECT count(*)::int AS total, COALESCE(sum(duration_minutes), 0)::int AS total_minutes
       FROM play_sessions s WHERE ${where}`,
      params,
    ),
    sql.query(
      `SELECT ${SESSION_COLUMNS} FROM play_sessions s JOIN games g ON g.id = s.game_id
       WHERE ${where} ORDER BY s.started_at DESC, s.id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, (page - 1) * limit],
    ),
  ]);

  res.json({ sessions, page, limit, total, total_minutes, has_more: page * limit < total });
}));

export default router;
