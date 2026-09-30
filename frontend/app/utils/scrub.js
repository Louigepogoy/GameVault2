// Removes secrets and personal data from error reports before they leave the browser.
// (Same rules as backend/src/scrub.js.)

const SECRET_KEY = /pass(word)?|token|secret|authorization|cookie|credential|api[-_]?key|dsn/i;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// Secrets written inside text, like "token=abc" in a URL or "Bearer eyJ..." in a message.
const INLINE_SECRET = /\b(pass(?:word)?|token|secret|api[-_]?key|code)=([^&\s"']+)/gi;
const BEARER = /\bBearer\s+[A-Za-z0-9._~+/=-]+/g;
const FILTERED = '[Filtered]';

/** Deep copy of `value` with secrets blanked and email addresses masked. */
export function scrub(value, depth = 0) {
  if (depth > 8) return value;
  if (typeof value === 'string') {
    return value
      .replace(EMAIL, '[email]')
      .replace(INLINE_SECRET, `$1=${FILTERED}`)
      .replace(BEARER, `Bearer ${FILTERED}`);
  }
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, v] of Object.entries(value)) {
      out[key] = SECRET_KEY.test(key) ? FILTERED : scrub(v, depth + 1);
    }
    return out;
  }
  return value;
}

/** Sentry beforeSend: scrub the whole event and keep only the user's id. */
export function scrubEvent(event) {
  const clean = scrub(event);
  if (clean.user) clean.user = clean.user.id ? { id: clean.user.id } : undefined;
  if (clean.request) {
    delete clean.request.cookies;
    delete clean.request.data; // request bodies can hold passwords and notes
  }
  return clean;
}

/** Sentry beforeBreadcrumb: same rules for breadcrumbs (URLs, console messages). */
export const scrubBreadcrumb = (crumb) => scrub(crumb);
