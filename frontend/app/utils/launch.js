// Opening the game itself (in Steam, another launcher, or as an Android app) from
// "Start playing". Browsers can't start programs directly, but they can follow a
// launcher's link (steam://...) or an Android "intent" link.

/** 'android' | 'ios' | 'desktop' for the device the app is running on. */
export function deviceKind() {
  if (import.meta.server || typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'android';
  // iPadOS reports itself as a Mac, but with touch.
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  return 'desktop';
}

const STEAM_COVER = /\/steam\/apps\/(\d+)\//;

const LAUNCHERS = {
  steam: { name: 'Steam', help: 'https://store.steampowered.com/about/' },
  'com.epicgames.launcher': { name: 'the Epic Games Launcher', help: 'https://store.epicgames.com/download' },
  heroic: { name: 'Heroic' },
  goggalaxy: { name: 'GOG Galaxy', help: 'https://www.gog.com/galaxy' },
  battlenet: { name: 'Battle.net', help: 'https://download.battle.net/' },
  uplay: { name: 'Ubisoft Connect', help: 'https://ubisoftconnect.com/' },
  origin2: { name: 'the EA app', help: 'https://www.ea.com/ea-app' },
  eadm: { name: 'the EA app', help: 'https://www.ea.com/ea-app' },
  riotclient: { name: 'the Riot Client' },
  xbox: { name: 'the Xbox app' },
  'ms-xbox': { name: 'the Xbox app' },
  intent: { name: 'the app' },
  https: { name: 'your browser' },
};

const schemeOf = (url) => /^([a-z][a-z0-9+.-]*):/i.exec(url ?? '')?.[1].toLowerCase() ?? null;

/** Launcher name and help link for a launch link, e.g. { name: 'Steam', help: '...' }. */
export const launcherFor = (url) => LAUNCHERS[schemeOf(url)] ?? { name: 'its launcher' };

/**
 * The link that opens this game on this device, or null. Uses the game's launch_url,
 * or Steam's when the cover comes from Steam. PC launcher links only make sense on a
 * computer and Android links only on Android, so others are skipped.
 */
export function launchLinkFor(game, device = deviceKind()) {
  const steamId = STEAM_COVER.exec(game?.cover_url ?? '')?.[1];
  const url = game?.launch_url || (steamId ? `steam://rungameid/${steamId}` : null);
  const scheme = schemeOf(url);
  if (!scheme || !LAUNCHERS[scheme]) return null;
  if (scheme === 'https') return url;
  if (scheme === 'intent') return device === 'android' ? url : null;
  return device === 'desktop' ? url : null;
}

/** From { steam, android } launch options, the one that fits the chosen platform. */
export function pickLaunch(launch, platform) {
  if (!launch) return null;
  const mobile = /android|ios|iphone|mobile/i.test(platform ?? '');
  return (mobile ? launch.android : launch.steam) ?? launch.steam ?? launch.android ?? null;
}

/** Follow a launch link. Web links open in a new tab; launcher links hand off to the app. */
export function openLaunchLink(url) {
  if (schemeOf(url) === 'https') window.open(url, '_blank', 'noopener');
  else window.location.href = url;
}
