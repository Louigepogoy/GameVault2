import { describe, expect, it } from 'vitest';
import { launchLinkFor, launcherFor, pickLaunch } from '~/utils/launch';

const STEAM = 'steam://rungameid/1145360';
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

describe('pickLaunch', () => {
  const both = { steam: STEAM, android: ANDROID };
  it('picks the Android app for phone platforms and Steam otherwise', () => {
    expect(pickLaunch(both, 'Android')).toBe(ANDROID);
    expect(pickLaunch(both, 'PC')).toBe(STEAM);
    expect(pickLaunch(both, '')).toBe(STEAM);
  });

  it('falls back to whatever exists', () => {
    expect(pickLaunch({ steam: null, android: ANDROID }, 'PC')).toBe(ANDROID);
    expect(pickLaunch({ steam: STEAM, android: null }, 'Android')).toBe(STEAM);
    expect(pickLaunch(null, 'PC')).toBeNull();
  });
});

describe('launcherFor', () => {
  it('names the launcher and links to its download page', () => {
    expect(launcherFor(STEAM)).toEqual({ name: 'Steam', help: 'https://store.steampowered.com/about/' });
    expect(launcherFor('com.epicgames.launcher://apps/x').name).toBe('the Epic Games Launcher');
    expect(launcherFor(ANDROID).name).toBe('the app');
  });
});
