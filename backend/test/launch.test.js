import { beforeAll, describe, expect, it } from 'vitest';
import { androidLaunchUrl, playPackage } from '../src/launch.js';
import { api, createGame, createUser, resetDb } from './helpers.js';

let u;
beforeAll(async () => {
  await resetDb();
  u = await createUser();
});

describe('launch_url', () => {
  it.each([
    'steam://rungameid/1145360',
    'com.epicgames.launcher://apps/Fortnite?action=launch&silent=true',
    androidLaunchUrl('com.mobile.legends'),
    'https://www.roblox.com/games/123',
  ])('accepts a launcher link: %s', async (launch_url) => {
    const res = await api().post('/api/games').set(u.auth).send({ title: 'Game', launch_url });
    expect(res.status).toBe(201);
    expect(res.body.launch_url).toBe(launch_url);
  });

  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'file:///C:/Windows/System32/calc.exe',
    'vbscript:msgbox',
    'http://example.com',
    'not a link',
  ])('rejects anything else: %s', async (launch_url) => {
    const res = await api().post('/api/games').set(u.auth).send({ title: 'Game', launch_url });
    expect(res.status).toBe(400);
  });

  it('can be changed and cleared', async () => {
    const g = await createGame(u.auth, { title: 'Hades', launch_url: 'steam://rungameid/1145360' });
    const cleared = await api().patch(`/api/games/${g.id}`).set(u.auth).send({ launch_url: '' });
    expect(cleared.body.launch_url).toBeNull();
    const blocked = await api().patch(`/api/games/${g.id}`).set(u.auth).send({ launch_url: 'javascript:x' });
    expect(blocked.status).toBe(400);
  });
});

describe('suggested launch links for games saved without one', () => {
  it('matches known titles, ignoring case and punctuation', async () => {
    const roblox = await createGame(u.auth, { title: 'roblox', platform: 'PC' });
    const listed = (await api().get('/api/games').set(u.auth)).body.find((g) => g.id === roblox.id);
    expect(listed.suggested_launch).toMatchObject({ web: 'https://www.roblox.com/home' });
    expect(listed.suggested_launch.android).toContain('package=com.roblox.client');

    const one = (await api().get(`/api/games/${roblox.id}`).set(u.auth)).body;
    expect(one.suggested_launch.web).toBe('https://www.roblox.com/home');
  });

  it("doesn't suggest anything when the game has its own link or is unknown", async () => {
    const own = await createGame(u.auth, { title: 'Roblox', launch_url: 'roblox://' });
    const unknown = await createGame(u.auth, { title: 'My Homebrew Game' });
    const list = (await api().get('/api/games').set(u.auth)).body;
    expect(list.find((g) => g.id === own.id).suggested_launch).toBeUndefined();
    expect(list.find((g) => g.id === unknown.id).suggested_launch).toBeUndefined();
  });
});

describe('launch links from the catalog', () => {
  it('reads the package name from a Google Play link', () => {
    expect(playPackage('https://play.google.com/store/apps/details?id=com.mobile.legends')).toBe(
      'com.mobile.legends',
    );
    expect(playPackage('https://store.steampowered.com/app/620/')).toBeNull();
  });

  it('builds an Android link that falls back to the Play Store', () => {
    const url = androidLaunchUrl('com.mobile.legends');
    expect(url).toMatch(/^intent:#Intent;.*package=com\.mobile\.legends;/);
    expect(decodeURIComponent(url)).toContain('play.google.com/store/apps/details?id=com.mobile.legends');
  });

  it('gives Discover games Steam and/or Android launch links', async () => {
    const games = (await api().get('/api/discover').set(u.auth)).body.games;
    const bySlug = Object.fromEntries(games.map((g) => [g.slug, g.launch]));
    expect(bySlug.hades).toEqual({ steam: 'steam://rungameid/1145360', android: null, web: null });
    expect(bySlug.roblox.web).toBe('https://www.roblox.com/home');
    expect(bySlug['mobile-legends'].steam).toBeNull();
    expect(bySlug['mobile-legends'].android).toContain('package=com.mobile.legends');
    expect(bySlug['stardew-valley'].steam).toBe('steam://rungameid/413150');
    expect(bySlug['stardew-valley'].android).toContain('package=com.chucklefish.stardewvalley');
    expect(games.some((g) => 'steamId' in g)).toBe(false);
  });
});
