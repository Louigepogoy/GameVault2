import { beforeAll, describe, expect, it } from 'vitest';
import { api, createGame, createUser, resetDb } from './helpers.js';

let u;
beforeAll(async () => {
  await resetDb();
  u = await createUser();
});

describe('games CRUD', () => {
  it('requires a title', async () => {
    const res = await api().post('/api/games').set(u.auth).send({ platform: 'PC' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/i);
  });

  it('creates a game with sensible defaults', async () => {
    const res = await api().post('/api/games').set(u.auth).send({ title: '  Hades  ', genre: 'Roguelike' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'Hades',
      status: 'backlog',
      favorite: false,
      rating: null,
      user_id: u.user.id,
    });
  });

  it('reads one game, and 404s or 400s for bad ids', async () => {
    const g = await createGame(u.auth, { title: 'Celeste' });
    expect((await api().get(`/api/games/${g.id}`).set(u.auth)).body.title).toBe('Celeste');
    expect((await api().get('/api/games/999999').set(u.auth)).status).toBe(404);
    expect((await api().get('/api/games/abc').set(u.auth)).status).toBe(400);
  });

  it('updates only valid fields', async () => {
    const g = await createGame(u.auth, { title: 'Elden Ring' });
    const res = await api()
      .patch(`/api/games/${g.id}`)
      .set(u.auth)
      .send({ status: 'playing', rating: 5, hours_played: 12.34, user_id: 999, unknown: 'x' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'playing', rating: 5, hours_played: 12.3, user_id: u.user.id });

    expect((await api().patch(`/api/games/${g.id}`).set(u.auth).send({})).status).toBe(400);
    expect((await api().patch(`/api/games/${g.id}`).set(u.auth).send({ rating: 9 })).status).toBe(400);
    expect((await api().patch(`/api/games/${g.id}`).set(u.auth).send({ status: 'wishful' })).status).toBe(
      400,
    );
  });

  it('deletes a game', async () => {
    const g = await createGame(u.auth, { title: 'To delete' });
    expect((await api().delete(`/api/games/${g.id}`).set(u.auth)).status).toBe(204);
    expect((await api().get(`/api/games/${g.id}`).set(u.auth)).status).toBe(404);
    expect((await api().delete(`/api/games/${g.id}`).set(u.auth)).status).toBe(404);
  });
});

describe('listing', () => {
  let owner;
  beforeAll(async () => {
    owner = await createUser();
    await createGame(owner.auth, {
      title: 'Zelda',
      status: 'completed',
      rating: 5,
      hours_played: 100,
      favorite: true,
    });
    await createGame(owner.auth, { title: 'apex', status: 'playing', rating: 3, hours_played: 40 });
    await createGame(owner.auth, { title: '100% Orange Juice', status: 'backlog' });
  });
  const titles = async (query = '') =>
    (await api().get(`/api/games${query}`).set(owner.auth)).body.map((g) => g.title);

  it('lists newest first by default', async () => {
    expect(await titles()).toEqual(['100% Orange Juice', 'apex', 'Zelda']);
  });

  it('searches, filters and sorts', async () => {
    expect(await titles('?q=ZEL')).toEqual(['Zelda']);
    expect(await titles('?q=100%25')).toEqual(['100% Orange Juice']); // % is matched literally
    expect(await titles('?status=playing')).toEqual(['apex']);
    expect(await titles('?favorite=1')).toEqual(['Zelda']);
    expect(await titles('?sort=title')).toEqual(['100% Orange Juice', 'apex', 'Zelda']);
    expect(await titles('?sort=hours')).toEqual(['Zelda', 'apex', '100% Orange Juice']);
  });

  it('rejects unknown filters', async () => {
    expect((await api().get('/api/games?status=nope').set(owner.auth)).status).toBe(400);
    expect((await api().get('/api/games?sort=id;drop').set(owner.auth)).status).toBe(400);
  });

  it('counts stats for this user', async () => {
    const res = await api().get('/api/stats').set(owner.auth);
    expect(res.body).toMatchObject({
      total: 3,
      favorites: 1,
      completed: 1,
      playing: 1,
      backlog: 1,
      hours: 140,
    });
  });
});
