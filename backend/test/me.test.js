import { beforeAll, describe, expect, it } from 'vitest';
import { api, createGame, createUser, resetDb } from './helpers.js';

beforeAll(resetDb);

describe('onboarding and preferences', () => {
  it('new accounts start with onboarding not done and no preferences', async () => {
    const u = await createUser();
    expect(u.user).toMatchObject({
      onboarding_completed: false,
      favorite_platforms: [],
      favorite_genres: [],
    });
    const me = await api().get('/api/auth/me').set(u.auth);
    expect(me.body.user.onboarding_completed).toBe(false);
  });

  it('saves preferences and the onboarding flag, and returns them on login', async () => {
    const u = await createUser({ email: 'prefs@example.com' });
    const res = await api()
      .patch('/api/me')
      .set(u.auth)
      .send({
        favorite_platforms: ['PC', 'Mobile', 'PC'],
        favorite_genres: [' RPG ', 'Roguelike', 'rpg'],
        onboarding_completed: true,
      });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      favorite_platforms: ['PC', 'Mobile'],
      favorite_genres: ['RPG', 'Roguelike'],
      onboarding_completed: true,
    });
    const login = await api()
      .post('/api/auth/login')
      .send({ email: 'prefs@example.com', password: u.password });
    expect(login.body.user.favorite_genres).toEqual(['RPG', 'Roguelike']);

    // "Redo onboarding" only flips the flag; preferences stay.
    const redo = await api().patch('/api/me').set(u.auth).send({ onboarding_completed: false });
    expect(redo.body.user).toMatchObject({
      onboarding_completed: false,
      favorite_platforms: ['PC', 'Mobile'],
    });
  });

  it.each([
    [{}, 'Nothing to update'],
    [{ favorite_platforms: ['GameCube'] }, 'unknown value'],
    [{ favorite_platforms: 'PC' }, 'must be a list'],
    [{ favorite_genres: ['x'.repeat(41)] }, 'short text'],
    [{ favorite_genres: Array.from({ length: 21 }, (_, i) => `G${i}`) }, 'at most 20'],
    [{ onboarding_completed: 'yes' }, 'true or false'],
  ])('validates input %#', async (body, message) => {
    const u = await createUser();
    const res = await api().patch('/api/me').set(u.auth).send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain(message);
  });

  it('only ever changes your own account', async () => {
    const a = await createUser();
    const b = await createUser();
    await api()
      .patch('/api/me')
      .set(b.auth)
      .send({ favorite_genres: ['Horror'] });
    const me = await api().get('/api/auth/me').set(a.auth);
    expect(me.body.user.favorite_genres).toEqual([]);
  });

  it('requires login', async () => {
    expect((await api().patch('/api/me').send({ onboarding_completed: true })).status).toBe(401);
  });

  it('uses favorite genres for Discover recommendations', async () => {
    const u = await createUser();
    expect((await api().get('/api/discover').set(u.auth)).body.recommended).toEqual([]);
    await api()
      .patch('/api/me')
      .set(u.auth)
      .send({ favorite_genres: ['Metroidvania'] });
    const { games, recommended } = (await api().get('/api/discover').set(u.auth)).body;
    expect(recommended).toContain('hollow-knight');
    expect(games.find((g) => g.slug === 'hollow-knight').match).toBe('Metroidvania');
  });
});

describe('wishlist status', () => {
  it('is a valid status for games', async () => {
    const u = await createUser();
    const g = await createGame(u.auth, { title: 'Silksong', status: 'wishlist' });
    expect(g.status).toBe('wishlist');
    const list = await api().get('/api/games?status=wishlist').set(u.auth);
    expect(list.body.map((x) => x.title)).toEqual(['Silksong']);
  });
});
