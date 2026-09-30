import { beforeAll, describe, expect, it } from 'vitest';
import { api, createGame, createUser, resetDb, sql } from './helpers.js';

let u;
beforeAll(async () => {
  await resetDb();
  u = await createUser();
});

const backdate = (id, minutes) =>
  sql`UPDATE play_sessions SET started_at = now() - make_interval(mins => ${minutes}) WHERE id = ${id}`;

describe('play sessions', () => {
  it('starts, allows only one at a time, and marks a backlog game as playing', async () => {
    const g1 = await createGame(u.auth, { title: 'One', status: 'backlog' });
    const g2 = await createGame(u.auth, { title: 'Two' });
    const start = await api().post('/api/sessions/start').set(u.auth).send({ game_id: g1.id });
    expect(start.status).toBe(201);
    expect(start.body.now).toBeTruthy();
    expect((await api().get(`/api/games/${g1.id}`).set(u.auth)).body.status).toBe('playing');

    const second = await api().post('/api/sessions/start').set(u.auth).send({ game_id: g2.id });
    expect(second.status).toBe(409);

    expect((await api().get('/api/sessions/active').set(u.auth)).body.session.id).toBe(start.body.session.id);
    await api().delete(`/api/sessions/${start.body.session.id}`).set(u.auth);
  });

  it('adds the played time to hours_played when stopped', async () => {
    const g = await createGame(u.auth, { title: 'Timed', hours_played: 10 });
    const { session } = (await api().post('/api/sessions/start').set(u.auth).send({ game_id: g.id })).body;
    await backdate(session.id, 90);
    const stop = await api()
      .post(`/api/sessions/${session.id}/stop`)
      .set(u.auth)
      .send({ note: ' good run ' });
    expect(stop.status).toBe(200);
    expect(stop.body.session).toMatchObject({
      duration_minutes: 90,
      note: 'good run',
      game_hours_played: 11.5,
    });
    expect((await api().post(`/api/sessions/${session.id}/stop`).set(u.auth).send({})).status).toBe(404);
  });

  it('caps a forgotten timer at 24 hours', async () => {
    const g = await createGame(u.auth, { title: 'Forgotten' });
    const { session } = (await api().post('/api/sessions/start').set(u.auth).send({ game_id: g.id })).body;
    await backdate(session.id, 3 * 24 * 60);
    const stop = await api().post(`/api/sessions/${session.id}/stop`).set(u.auth).send({});
    expect(stop.body.session.duration_minutes).toBe(1440);
  });

  it('discards a running session without adding time', async () => {
    const g = await createGame(u.auth, { title: 'Oops' });
    const { session } = (await api().post('/api/sessions/start').set(u.auth).send({ game_id: g.id })).body;
    await backdate(session.id, 30);
    expect((await api().delete(`/api/sessions/${session.id}`).set(u.auth)).status).toBe(204);
    expect((await api().get(`/api/games/${g.id}`).set(u.auth)).body.hours_played).toBeNull();
  });

  it('paginates history and validates input', async () => {
    const list = await api().get('/api/sessions?limit=1').set(u.auth);
    expect(list.body).toMatchObject({ page: 1, limit: 1, has_more: true });
    expect(list.body.sessions).toHaveLength(1);
    expect((await api().get('/api/sessions?limit=500').set(u.auth)).status).toBe(400);
    expect((await api().post('/api/sessions/start').set(u.auth).send({ game_id: 'x' })).status).toBe(400);
    expect(
      (
        await api()
          .patch('/api/sessions/1')
          .set(u.auth)
          .send({ note: 'x'.repeat(501) })
      ).status,
    ).toBe(400);
  });
});

describe('heatmap', () => {
  it('groups minutes by day in the requested time zone', async () => {
    const g = await createGame(u.auth, { title: 'Late night' });
    // 23:30 UTC yesterday = 07:30 today in Manila
    await sql`
      INSERT INTO play_sessions (user_id, game_id, started_at, ended_at, duration_minutes)
      VALUES (${u.user.id}, ${g.id}, date_trunc('day', now()) - interval '30 minutes', date_trunc('day', now()), 30)
    `;
    const utc = (await api().get('/api/stats/heatmap?weeks=1&tz=UTC').set(u.auth)).body.days;
    const manila = (await api().get('/api/stats/heatmap?weeks=1&tz=Asia/Manila').set(u.auth)).body.days;
    expect(utc).toHaveLength(7);
    expect(utc.at(-2).minutes).toBeGreaterThanOrEqual(30); // yesterday in UTC
    expect(manila.at(-1).minutes).toBeGreaterThanOrEqual(30); // today in Manila
  });

  it('rejects bad time zones and week counts', async () => {
    expect((await api().get('/api/stats/heatmap?tz=Mars/Olympus').set(u.auth)).status).toBe(400);
    expect((await api().get("/api/stats/heatmap?tz=UTC';drop").set(u.auth)).status).toBe(400);
    expect((await api().get('/api/stats/heatmap?weeks=99').set(u.auth)).status).toBe(400);
  });
});

describe('achievements', () => {
  it('unlocks First Steps on the first game and Marathon after a 3h session', async () => {
    const fresh = await createUser();
    const first = await api().post('/api/games').set(fresh.auth).send({ title: 'First' });
    expect(first.body.achievements_unlocked.map((a) => a.code)).toEqual(['first_game']);
    const second = await api().post('/api/games').set(fresh.auth).send({ title: 'Second' });
    expect(second.body.achievements_unlocked).toEqual([]);

    const { session } = (
      await api().post('/api/sessions/start').set(fresh.auth).send({ game_id: first.body.id })
    ).body;
    await backdate(session.id, 185);
    const stop = await api().post(`/api/sessions/${session.id}/stop`).set(fresh.auth).send({});
    expect(stop.body.achievements_unlocked.map((a) => a.code)).toContain('marathon');
  });

  it('uses the X-Timezone header for Night Owl', async () => {
    const owl = await createUser();
    const g = await createGame(owl.auth, { title: 'Owl game' });
    // 01:30 in Manila = 17:30 UTC the day before
    await sql`
      INSERT INTO play_sessions (user_id, game_id, started_at, ended_at, duration_minutes)
      VALUES (${owl.user.id}, ${g.id},
        (date_trunc('day', now() AT TIME ZONE 'Asia/Manila') + interval '90 minutes') AT TIME ZONE 'Asia/Manila',
        (date_trunc('day', now() AT TIME ZONE 'Asia/Manila') + interval '120 minutes') AT TIME ZONE 'Asia/Manila', 30)
    `;
    const utc = await api().get('/api/achievements').set(owl.auth).set('X-Timezone', 'UTC');
    expect(utc.body.achievements.find((a) => a.code === 'night_owl').unlocked).toBe(false);
    const manila = await api().get('/api/achievements').set(owl.auth).set('X-Timezone', 'Asia/Manila');
    expect(manila.body.achievements_unlocked.map((a) => a.code)).toContain('night_owl');
  });
});
