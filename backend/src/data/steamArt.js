// Current Steam header images, looked up from Steam's public store API.
// Steam moves artwork to new URLs when it changes (sales, updates), so the fixed
// /apps/<id>/header.jpg can show outdated art. Refreshed in the background.

const REFRESH_MS = 12 * 60 * 60 * 1000;
const headers = new Map(); // steamId -> current header URL

async function fetchHeader(id) {
  const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${id}&filters=basic`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const entry = (await res.json())?.[id];
  const url = entry?.success ? entry.data?.header_image : null;
  return typeof url === 'string' && url.startsWith('https://') ? url : null;
}

async function refresh(ids) {
  for (const id of ids) {
    try {
      const url = await fetchHeader(id);
      if (url) headers.set(id, url);
    } catch {
      // Keep the previous or fallback image; try again next refresh.
    }
  }
}

/** Start keeping header images fresh for these Steam app ids. */
export function watchSteamArt(ids) {
  refresh(ids);
  setInterval(() => refresh(ids), REFRESH_MS).unref();
}

export const currentHeader = (id) => headers.get(id);
