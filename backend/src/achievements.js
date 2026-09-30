import { sql } from './db.js';

// All achievements in one place. To add one: add an entry here, and if it needs a new
// number, add it to collectStats() below. Once unlocked, an achievement stays unlocked.
//
// progress(stats) returns how far along the user is; the achievement unlocks when
// current >= target. `unit` tells the app how to show the numbers.
export const ACHIEVEMENTS = [
  {
    code: 'first_game',
    title: 'First Steps',
    description: 'Add your first game to the vault.',
    icon: '🎮',
    progress: (s) => ({ current: s.games, target: 1 }),
  },
  {
    code: 'finisher',
    title: 'Finisher',
    description: 'Complete 10 games.',
    icon: '🏆',
    progress: (s) => ({ current: s.completed, target: 10 }),
  },
  {
    code: 'night_owl',
    title: 'Night Owl',
    description: 'Start a play session between midnight and 4 AM.',
    icon: '🦉',
    progress: (s) => ({ current: s.nightSessions ? 1 : 0, target: 1 }),
  },
  {
    code: 'genre_explorer',
    title: 'Genre Explorer',
    description: 'Complete games in 5 different genres.',
    icon: '🧭',
    progress: (s) => ({ current: s.completedGenres, target: 5, unit: 'genres' }),
  },
  {
    code: 'marathon',
    title: 'Marathon',
    description: 'Play for 3 hours or more in one session.',
    icon: '⏱️',
    progress: (s) => ({ current: s.longestSessionMinutes, target: 180, unit: 'minutes' }),
  },
  {
    code: 'collector',
    title: 'Collector',
    description: 'Have 50 games in your vault.',
    icon: '📚',
    progress: (s) => ({ current: s.games, target: 50, unit: 'games' }),
  },
];

const byCode = new Map(ACHIEVEMENTS.map((a) => [a.code, a]));

/** The numbers the checks need, in one round trip. `tz` decides what "midnight" means. */
async function collectStats(userId, tz) {
  const [s] = await sql`
    SELECT
      (SELECT count(*)::int FROM games WHERE user_id = ${userId}) AS games,
      (SELECT count(*)::int FROM games WHERE user_id = ${userId} AND status = 'completed') AS completed,
      (SELECT count(DISTINCT lower(trim(genre)))::int FROM games
        WHERE user_id = ${userId} AND status = 'completed' AND coalesce(trim(genre), '') <> '') AS completed_genres,
      (SELECT coalesce(max(duration_minutes), 0)::int FROM play_sessions
        WHERE user_id = ${userId} AND ended_at IS NOT NULL) AS longest_session_minutes,
      (SELECT count(*)::int FROM play_sessions
        WHERE user_id = ${userId} AND extract(hour FROM started_at AT TIME ZONE ${tz}) < 4) AS night_sessions
  `;
  return {
    games: s.games,
    completed: s.completed,
    completedGenres: s.completed_genres,
    longestSessionMinutes: s.longest_session_minutes,
    nightSessions: s.night_sessions,
  };
}

const publicFields = ({ code, title, description, icon }) => ({ code, title, description, icon });

/**
 * Unlock whatever the user now qualifies for. Returns only the newly unlocked ones
 * (for the "achievement unlocked" toast). Never throws: achievements must not break
 * the action that triggered them.
 */
export async function evaluateAchievements(userId, tz = 'UTC') {
  try {
    const [stats, rows] = await Promise.all([
      collectStats(userId, tz),
      sql`SELECT code FROM user_achievements WHERE user_id = ${userId}`,
    ]);
    const have = new Set(rows.map((r) => r.code));
    const earned = ACHIEVEMENTS.filter((a) => {
      if (have.has(a.code)) return false;
      const { current, target } = a.progress(stats);
      return current >= target;
    }).map((a) => a.code);
    if (!earned.length) return [];

    // ON CONFLICT: two requests at once can't unlock (and announce) the same one twice.
    const inserted = await sql`
      INSERT INTO user_achievements (user_id, code)
      SELECT ${userId}, unnest(${earned}::text[])
      ON CONFLICT DO NOTHING
      RETURNING code
    `;
    return inserted.map((r) => publicFields(byCode.get(r.code)));
  } catch (err) {
    console.error('Achievement check failed:', err);
    return [];
  }
}

/** Every achievement with unlocked state and progress, for the achievements screen. */
export async function listAchievements(userId, tz = 'UTC') {
  const [stats, rows] = await Promise.all([
    collectStats(userId, tz),
    sql`SELECT code, unlocked_at FROM user_achievements WHERE user_id = ${userId}`,
  ]);
  const unlockedAt = new Map(rows.map((r) => [r.code, r.unlocked_at]));
  return ACHIEVEMENTS.map((a) => {
    const { current, target, unit = null } = a.progress(stats);
    const unlocked = unlockedAt.has(a.code);
    return {
      ...publicFields(a),
      unlocked,
      unlocked_at: unlockedAt.get(a.code) ?? null,
      // Unlocked ones show as complete, even if the numbers later drop (e.g. games deleted).
      progress: { current: unlocked ? target : Math.min(current, target), target, unit },
    };
  });
}
