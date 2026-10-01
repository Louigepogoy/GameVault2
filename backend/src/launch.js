// Links that open a game in its launcher or as an app, used for "Start playing".
import { CATALOG } from './data/catalog.js';

/** Opens (and if needed installs) a Steam game in the Steam client. */
export const steamLaunchUrl = (appId) => `steam://rungameid/${appId}`;

/**
 * Opens an Android app by package name. If it isn't installed, Chrome goes to its
 * Play Store page instead.
 */
export function androidLaunchUrl(pkg) {
  const store = encodeURIComponent(`https://play.google.com/store/apps/details?id=${pkg}`);
  return (
    'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;' +
    `package=${pkg};S.browser_fallback_url=${store};end`
  );
}

/** Package name from a Google Play link, or null. */
export const playPackage = (url) => /[?&]id=([A-Za-z0-9._]+)/.exec(url ?? '')?.[1] ?? null;

/**
 * { pc, android, web } launch links for a catalog game (any may be null).
 * pc: Steam, or the game's own launcher link (e.g. Epic for Fortnite).
 */
export function catalogLaunch(item) {
  const play = item.links?.find((l) => l.label === 'Google Play');
  const pkg = play ? playPackage(play.url) : null;
  return {
    pc: item.steamId ? steamLaunchUrl(item.steamId) : (item.pcLaunch ?? null),
    android: pkg ? androidLaunchUrl(pkg) : null,
    web: item.webLaunch ?? null,
  };
}

const norm = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const byTitle = new Map(CATALOG.map((g) => [norm(g.title), g]));

/**
 * Launch links for a game saved without one (e.g. added before launch links existed),
 * found by matching its title to a known game. Null if unknown.
 */
export function suggestedLaunch(title) {
  const item = byTitle.get(norm(title));
  if (!item) return null;
  const launch = catalogLaunch(item);
  return launch.pc || launch.android || launch.web ? launch : null;
}
