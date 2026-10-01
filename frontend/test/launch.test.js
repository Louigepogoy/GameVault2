import { describe, expect, it } from 'vitest';
import { launchLinkFor, launcherFor, pickLaunch } from '~/utils/launch';

const STEAM = 'steam://rungameid/1145360';
const ROBLOX_WEB = 'https://www.roblox.com/home';
const ANDROID =
  'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.mobile.legends;end';

describe('launchLinkFor', () => {
  it('opens Steam games on a computer only', () => {
    const game = { launch_url: STEAM };
    expect(launchLinkFor(game, 'desktop')).toBe(STEAM);
    expect(launchLinkFor(game, 'android')).toBeNull();
    expect(launchLinkFor(game, 'ios')).toBeNull();
  });

  it('opens Android apps on Android only', () => {
    const game = { launch_url: ANDROID };
    expect(launchLinkFor(game, 'android')).toBe(ANDROID);
    expect(launchLinkFor(game, 'desktop')).toBeNull();
  });

  it('opens web games everywhere', () => {
    const game = { launch_url: 'https://www.roblox.com/games/1' };
    expect(launchLinkFor(game, 'ios')).toBe('https://www.roblox.com/games/1');
  });

  it('works out the Steam link from a Steam cover when no link was saved', () => {
    const game = {
      cover_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/367520/library_600x900.jpg',
    };
    expect(launchLinkFor(game, 'desktop')).toBe('steam://rungameid/367520');
  });

  it('never opens unknown or dangerous links', () => {
    expect(launchLinkFor({ launch_url: 'javascript:alert(1)' }, 'desktop')).toBeNull();
    expect(launchLinkFor({ launch_url: 'file:///C:/x.exe' }, 'desktop')).toBeNull();
    expect(launchLinkFor({ title: 'No link' }, 'desktop')).toBeNull();
  });
});

describe('suggested links for games saved without one', () => {
  const roblox = {
    title: 'Roblox',
    launch_url: null,
    suggested_launch: { pc: null, android: ANDROID, web: ROBLOX_WEB },
  };

  it('opens Roblox on the web on a computer or iPhone, and the app on Android', () => {
    expect(launchLinkFor(roblox, 'desktop')).toBe(ROBLOX_WEB);
    expect(launchLinkFor(roblox, 'ios')).toBe(ROBLOX_WEB);
    expect(launchLinkFor(roblox, 'android')).toBe(ANDROID);
  });

  it("falls back to the suggestion when the saved link doesn't fit this device", () => {
    expect(launchLinkFor({ ...roblox, launch_url: ANDROID }, 'desktop')).toBe(ROBLOX_WEB);
  });

  it('opens roblox:// app links on any device', () => {
    expect(launchLinkFor({ launch_url: 'roblox://' }, 'ios')).toBe('roblox://');
  });
});

describe('pickLaunch', () => {
  const both = { pc: STEAM, android: ANDROID };
  it('picks the Android app for phone platforms and Steam otherwise', () => {
    expect(pickLaunch(both, 'Android')).toBe(ANDROID);
    expect(pickLaunch(both, 'PC')).toBe(STEAM);
    expect(pickLaunch(both, '')).toBe(STEAM);
  });

  it('uses the web link when there is no app/launcher link for that platform', () => {
    expect(pickLaunch({ pc: null, android: ANDROID, web: ROBLOX_WEB }, 'PC')).toBe(ROBLOX_WEB);
    expect(pickLaunch({ pc: STEAM, android: null, web: null }, 'Android')).toBeNull();
    expect(pickLaunch(null, 'PC')).toBeNull();
  });

  it('never gives a PC game an Android-only link', () => {
    expect(pickLaunch({ pc: null, android: ANDROID, web: null }, 'PC')).toBeNull();
  });
});

describe('Epic and other PC launchers', () => {
  const fortnite = {
    title: 'Fortnite',
    suggested_launch: {
      pc: 'com.epicgames.launcher://apps/Fortnite?action=launch&silent=true',
      android: null,
      web: null,
    },
  };
  it('launches Fortnite through Epic on a computer', () => {
    expect(launchLinkFor(fortnite, 'desktop')).toMatch(/^com.epicgames.launcher:/);
    expect(launchLinkFor(fortnite, 'android')).toBeNull();
  });

  it('still understands the old "steam" key', () => {
    expect(pickLaunch({ steam: STEAM, android: null, web: null }, 'PC')).toBe(STEAM);
  });
});

describe('launcherFor', () => {
  it('names the launcher and links to its download page', () => {
    expect(launcherFor(STEAM)).toEqual({ name: 'Steam', help: 'https://store.steampowered.com/about/' });
    expect(launcherFor('com.epicgames.launcher://apps/x').name).toBe('the Epic Games Launcher');
    expect(launcherFor(ANDROID).name).toBe('the app');
    expect(launcherFor(ROBLOX_WEB).name).toBe('roblox.com');
  });
});
