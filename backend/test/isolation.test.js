// A user must NEVER be able to read, change, or delete another user's data.
import { beforeAll, describe, expect, it } from 'vitest';
import { api, createGame, createUser, resetDb, sql } from './helpers.js';

let alice;
let bob;
let aliceGame;
let aliceDone; // a finished session
let aliceRunning; // a running session

beforeAll(async () => {
  await resetDb();
  alice = await createUser({ name: 'Alice' });
  bob = await createUser({ name: 'Bob' });
  aliceGame = await createGame(alice.auth, { title: 'Alice Secret Game', status: 'playing', genre: 'RPG' });

  aliceDone = (await api().post('/api/sessions/start').set(alice.auth).send({ game_id: aliceGame.id })).body.session;
  await sql`UPDATE play_sessions SET started_at = now() - interval '2 hours' WHERE id = ${aliceDone.id}`;
  await api().post(`/api/sessions/${aliceDone.id}/stop`).set(alice.auth).send({ note: 'private note' });
  aliceRunning = (await api().post('/api/sessions/start').set(alice.auth).send({ game_id: aliceGame.id })).body.session;
});

describe("another user's games", () => {
  it('are not listed', async () => {
    const res = await api().get('/api/games').set(bob.auth);
    expect(res.body).toEqual([]);
  });

  it('cannot be read', async () => {
    expect((await api().get(`/api/games/${aliceGame.id}`).set(bob.auth)).status).toBe(404);
  });

  it('cannot be updated', async () => {
    const res = await api().patch(`/api/games/${aliceGame.id}`).set(bob.auth).send({ title: 'Hacked' });
    expect(res.status).toBe(404);
    const [row] = await sql`SELECT title FROM games WHERE id = ${aliceGame.id}`;
    expect(row.title).toBe('Alice Secret Game');
  });

  it('cannot be deleted', async () => {
    expect((await api().delete(`/api/games/${aliceGame.id}`).set(bob.auth)).status).toBe(404);
    const [row] = await sql`SELECT count(*)::int AS n FROM games WHERE id = ${aliceGame.id}`;
    expect(row.n).toBe(1);
  });

  it('do not show up in stats, discover or achievements', async () => {
    const stats = (await api().get('/api/stats').set(bob.auth)).body;
    expect(stats).toMatchObject({ total: 0, hours: 0 });
    expect(stats.most_played).toEqual([]);

    const achievements = (await api().get('/api/achievements').set(bob.auth)).body.achievements;
    expect(achievements.filter((a) => a.unlocked)).toEqual([]);
  });
});

describe("another user's sessions", () => {
  it('cannot be started on their game', async () => {
    const res = await api().post('/api/sessions/start').set(bob.auth).send({ game_id: aliceGame.id });
    expect(res.status).toBe(404);
  });

  it('are not visible as active or in history', async () => {
    expect((await api().get('/api/sessions/active').set(bob.auth)).body.session).toBeNull();
    const byGame = (await api().get(`/api/sessions?game_id=${aliceGame.id}`).set(bob.auth)).body;
    expect(byGame).toMatchObject({ sessions: [], total: 0 });
    const all = (await api().get('/api/sessions').set(bob.auth)).body;
    expect(all.total).toBe(0);
  });

  it('cannot be stopped, edited or discarded', async () => {
    expect((await api().post(`/api/sessions/${aliceRunning.id}/stop`).set(bob.auth).send({})).status).toBe(404);
    expect((await api().patch(`/api/sessions/${aliceDone.id}`).set(bob.auth).send({ note: 'x' })).status).toBe(404);
    expect((await api().delete(`/api/sessions/${aliceRunning.id}`).set(bob.auth)).status).toBe(404);

    const [running] = await sql`SELECT ended_at FROM play_sessions WHERE id = ${aliceRunning.id}`;
    const [done] = await sql`SELECT note FROM play_sessions WHERE id = ${aliceDone.id}`;
    expect(running.ended_at).toBeNull();
    expect(done.note).toBe('private note');
  });

  it('do not appear in the heatmap', async () => {
    const days = (await api().get('/api/stats/heatmap?tz=UTC').set(bob.auth)).body.days;
    expect(days.reduce((sum, d) => sum + d.minutes, 0)).toBe(0);
  });
});
