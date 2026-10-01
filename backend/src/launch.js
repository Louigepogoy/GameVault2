// Links that open a game in its launcher or as an app, used for "Start playing".

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

/** { steam, android } launch links for a catalog game (either may be null). */
export function catalogLaunch(item) {
  const play = item.links?.find((l) => l.label === 'Google Play');
  const pkg = play ? playPackage(play.url) : null;
  return {
    steam: item.steamId ? steamLaunchUrl(item.steamId) : null,
    android: pkg ? androidLaunchUrl(pkg) : null,
  };
}
