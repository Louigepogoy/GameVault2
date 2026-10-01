export const STATUSES = ['backlog', 'playing', 'completed', 'dropped', 'wishlist'];

// Platform groups people pick during onboarding (not the exact consoles on a game).
export const PLATFORM_PREFS = ['PC', 'PlayStation', 'Xbox', 'Switch', 'Mobile'];

const stringList = (value, field, { allowed, max = 20, maxLength = 40 } = {}) => {
  if (!Array.isArray(value)) throw new HttpError(400, `${field} must be a list`);
  if (value.length > max) throw new HttpError(400, `${field} can have at most ${max} items`);
  const out = [];
  for (const item of value) {
    if (typeof item !== 'string' || !item.trim() || item.trim().length > maxLength) {
      throw new HttpError(400, `${field} must be short text values`);
    }
    const v = item.trim();
    if (allowed && !allowed.includes(v)) throw new HttpError(400, `${field}: unknown value "${v}"`);
    if (!out.some((x) => x.toLowerCase() === v.toLowerCase())) out.push(v);
  }
  return out;
};

/** PATCH /api/me body: any of favorite_platforms, favorite_genres, onboarding_completed. */
export function validateProfileUpdate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Request body must be a JSON object');
  }
  const out = {};
  if ('favorite_platforms' in body) {
    out.favorite_platforms = stringList(body.favorite_platforms, 'favorite_platforms', {
      allowed: PLATFORM_PREFS,
    });
  }
  if ('favorite_genres' in body) out.favorite_genres = stringList(body.favorite_genres, 'favorite_genres');
  if ('onboarding_completed' in body) {
    if (typeof body.onboarding_completed !== 'boolean') {
      throw new HttpError(400, 'onboarding_completed must be true or false');
    }
    out.onboarding_completed = body.onboarding_completed;
  }
  if (!Object.keys(out).length) throw new HttpError(400, 'Nothing to update');
  return out;
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const optionalText = (value, field, max) => {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') throw new HttpError(400, `${field} must be a string`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new HttpError(400, `${field} must be at most ${max} characters`);
  return trimmed || null;
};

// Launch links the app is allowed to open. Anything else (javascript:, file:, data:...)
// is rejected, since the browser follows this link when you press "Start playing".
const LAUNCH_SCHEMES = new Set([
  'https',
  'steam', // Steam
  'com.epicgames.launcher', // Epic Games
  'heroic', // Heroic (Epic/GOG on Linux)
  'goggalaxy', // GOG Galaxy
  'battlenet', // Battle.net
  'uplay', // Ubisoft Connect
  'origin2', // EA app (legacy Origin links)
  'eadm', // EA app
  'riotclient', // Riot (VALORANT, League)
  'xbox', // Xbox app
  'ms-xbox', // Xbox app
  'intent', // Android apps (Chrome on Android)
]);

const validators = {
  title(value) {
    if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, 'Title is required');
    if (value.trim().length > 200) throw new HttpError(400, 'Title must be at most 200 characters');
    return value.trim();
  },
  platform: (v) => optionalText(v, 'platform', 100),
  genre: (v) => optionalText(v, 'genre', 100),
  status(value) {
    if (!STATUSES.includes(value)) throw new HttpError(400, `status must be one of: ${STATUSES.join(', ')}`);
    return value;
  },
  favorite(value) {
    if (typeof value !== 'boolean') throw new HttpError(400, 'favorite must be a boolean');
    return value;
  },
  rating(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > 5)
      throw new HttpError(400, 'rating must be an integer from 1 to 5');
    return n;
  },
  hours_played(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > 100000) {
      throw new HttpError(400, 'hours_played must be a number from 0 to 100000');
    }
    return Math.round(n * 10) / 10;
  },
  cover_url(value) {
    const url = optionalText(value, 'cover_url', 2000);
    if (url && !/^https?:\/\//i.test(url)) throw new HttpError(400, 'cover_url must be an http(s) URL');
    return url;
  },
  notes: (v) => optionalText(v, 'notes', 5000),
  launch_url(value) {
    const url = optionalText(value, 'launch_url', 2000);
    if (!url) return null;
    const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url)?.[1].toLowerCase();
    if (!LAUNCH_SCHEMES.has(scheme)) {
      throw new HttpError(400, 'launch_url must be a game launcher link (like steam://...) or an https link');
    }
    return url;
  },
};

// Whitelist of writable columns; PATCH only ever interpolates these names into SQL.
export const FIELDS = Object.keys(validators);

/** Validate the known fields present in body. Unless `partial`, title is required. */
export function validateGame(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Request body must be a JSON object');
  }
  if (!partial && !('title' in body)) throw new HttpError(400, 'Title is required');

  const out = {};
  for (const field of FIELDS) {
    if (field in body) out[field] = validators[field](body[field]);
  }
  return out;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value) {
  if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, 'Email is required');
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) throw new HttpError(400, 'Enter a valid email address');
  return email;
}

export function validatePassword(value) {
  if (typeof value !== 'string' || !value) throw new HttpError(400, 'Password is required');
  if (value.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
  // bcrypt only uses the first 72 bytes.
  if (Buffer.byteLength(value) > 72) throw new HttpError(400, 'Password must be at most 72 characters');
  return value;
}

export function validateName(value) {
  if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, 'Name is required');
  if (value.trim().length > 80) throw new HttpError(400, 'Name must be at most 80 characters');
  return value.trim();
}

export function parseId(raw, what = 'game') {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, `Invalid ${what} id`);
  return id;
}

/** Whole number from a query string, clamped to [min, max]; `fallback` when missing. */
export function parseIntParam(raw, { min, max, fallback, name }) {
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max)
    throw new HttpError(400, `${name} must be a whole number from ${min} to ${max}`);
  return n;
}

export function validateNote(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new HttpError(400, 'note must be a string');
  const note = value.trim();
  if (note.length > 500) throw new HttpError(400, 'note must be at most 500 characters');
  return note || null;
}

/** The browser's time zone from the X-Timezone header; UTC if missing or invalid. */
export function requestTimeZone(req) {
  try {
    return validateTimeZone(req.get('x-timezone'));
  } catch {
    return 'UTC';
  }
}

/** An IANA time zone name like "Asia/Manila". */
export function validateTimeZone(value) {
  if (value === undefined || value === '') return 'UTC';
  if (typeof value !== 'string' || value.length > 64 || !/^[A-Za-z0-9_+-/]+$/.test(value)) {
    throw new HttpError(400, 'tz must be a time zone name like Asia/Manila');
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
  } catch {
    throw new HttpError(400, `Unknown time zone: ${value}`);
  }
  return value;
}
