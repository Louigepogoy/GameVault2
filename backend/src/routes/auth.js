import { createHash, randomBytes } from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { sql } from '../db.js';
import { publicUser, requireAuth, signToken } from '../auth.js';
import { sendPasswordResetEmail } from '../mailer.js';
import { HttpError, validateEmail, validateName, validatePassword } from '../validate.js';

const router = Router();

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const BCRYPT_ROUNDS = 12;
const RESET_TTL_MINUTES = 60;
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');

// Google sign-in is enabled when GOOGLE_CLIENT_ID is set.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

// Small in-memory limiter against password guessing and reset-email spam.
// Per process only, which is fine for a single server instance.
function rateLimit({ windowMs, max }) {
  const hits = new Map();
  return (req, _res, next) => {
    const now = Date.now();
    const entry = hits.get(req.ip);
    if (!entry || entry.reset < now) {
      hits.set(req.ip, { count: 1, reset: now + windowMs });
      return next();
    }
    if (++entry.count > max) return next(new HttpError(429, 'Too many attempts. Please wait a few minutes.'));
    next();
  };
}
// AUTH_RATE_LIMIT_MAX raises the limit where many sign-ups come from one address (tests).
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20 });

const body = (req) => {
  if (!req.body || typeof req.body !== 'object') throw new HttpError(400, 'Request body must be a JSON object');
  return req.body;
};

// Games created before accounts existed have no owner; give them to the first account.
const claimOrphanGames = (userId) => sql`
  UPDATE games SET user_id = ${userId}
  WHERE user_id IS NULL AND (SELECT count(*) FROM users) = 1
`;

// POST /api/auth/register { name, email, password }
router.post('/register', limiter, wrap(async (req, res) => {
  const b = body(req);
  const name = validateName(b.name);
  const email = validateEmail(b.email);
  const password = validatePassword(b.password);

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  let user;
  try {
    [user] = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${passwordHash})
      RETURNING *
    `;
  } catch (err) {
    if (err.code === '23505') throw new HttpError(409, 'An account with this email already exists');
    throw err;
  }

  await claimOrphanGames(user.id);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

// POST /api/auth/login { email, password }
router.post('/login', limiter, wrap(async (req, res) => {
  const b = body(req);
  const email = validateEmail(b.email);
  if (typeof b.password !== 'string' || !b.password) throw new HttpError(400, 'Password is required');

  const [user] = await sql`SELECT * FROM users WHERE lower(email) = ${email}`;
  if (user && !user.password_hash) {
    throw new HttpError(401, 'This account uses Google sign-in. Continue with Google, or use "Forgot password?" to set a password.');
  }
  const ok = user && (await bcrypt.compare(b.password, user.password_hash));
  if (!ok) throw new HttpError(401, 'Incorrect email or password');

  res.json({ token: signToken(user), user: publicUser(user) });
}));

// POST /api/auth/google { credential }
// credential is the ID token from the "Sign in with Google" button.
router.post('/google', limiter, wrap(async (req, res) => {
  if (!googleClient) throw new HttpError(501, 'Google sign-in is not set up on the server');
  const { credential } = body(req);
  if (typeof credential !== 'string' || !credential) throw new HttpError(400, 'Missing Google credential');

  let payload;
  try {
    // Checks Google's signature, expiry and that the token was issued for our client ID.
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    throw new HttpError(401, 'Google sign-in failed. Please try again.');
  }
  if (!payload?.email || !payload.email_verified) {
    throw new HttpError(401, 'Your Google account email is not verified');
  }

  const googleId = payload.sub;
  const email = payload.email.toLowerCase();
  const name = (payload.name || email.split('@')[0]).trim().slice(0, 80);

  // 1. Returning Google user.
  let [user] = await sql`SELECT * FROM users WHERE google_id = ${googleId}`;

  // 2. Existing email/password account: link it (Google has verified the email).
  if (!user) {
    [user] = await sql`
      UPDATE users SET google_id = ${googleId}
      WHERE lower(email) = ${email} AND google_id IS NULL
      RETURNING *
    `;
  }

  // 3. New account.
  let created = false;
  if (!user) {
    [user] = await sql`
      INSERT INTO users (name, email, google_id)
      VALUES (${name}, ${email}, ${googleId})
      ON CONFLICT DO NOTHING
      RETURNING *
    `;
    if (!user) throw new HttpError(409, 'An account with this email already exists');
    created = true;
    await claimOrphanGames(user.id);
  }

  res.status(created ? 201 : 200).json({ token: signToken(user), user: publicUser(user) });
}));

// GET /api/auth/me
router.get('/me', requireAuth, wrap(async (req, res) => {
  const [user] = await sql`SELECT * FROM users WHERE id = ${req.userId}`;
  if (!user) throw new HttpError(401, 'Your session has expired. Please log in again.');
  res.json({ user: publicUser(user) });
}));

// POST /api/auth/forgot-password { email }
// Always answers the same way so it can't be used to find out which emails have accounts.
router.post('/forgot-password', limiter, wrap(async (req, res) => {
  const email = validateEmail(body(req).email);
  const [user] = await sql`SELECT id, name, email FROM users WHERE lower(email) = ${email}`;

  if (user) {
    const token = randomBytes(32).toString('hex');
    await sql`DELETE FROM password_resets WHERE user_id = ${user.id}`;
    await sql`
      INSERT INTO password_resets (token_hash, user_id, expires_at)
      VALUES (${hashToken(token)}, ${user.id}, now() + make_interval(mins => ${RESET_TTL_MINUTES}))
    `;
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      link: `${FRONTEND_URL}/reset-password?token=${token}`,
    });
  }

  res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
}));

// POST /api/auth/reset-password { token, password }
router.post('/reset-password', limiter, wrap(async (req, res) => {
  const b = body(req);
  if (typeof b.token !== 'string' || !/^[0-9a-f]{64}$/.test(b.token)) {
    throw new HttpError(400, 'This reset link is invalid or has expired');
  }
  const password = validatePassword(b.password);

  // Delete as we read so each link works only once.
  const [reset] = await sql`
    DELETE FROM password_resets
    WHERE token_hash = ${hashToken(b.token)}
    RETURNING user_id, expires_at > now() AS valid
  `;
  if (!reset?.valid) throw new HttpError(400, 'This reset link is invalid or has expired');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const [user] = await sql`
    UPDATE users SET password_hash = ${passwordHash} WHERE id = ${reset.user_id} RETURNING *
  `;
  await sql`DELETE FROM password_resets WHERE user_id = ${user.id}`;

  res.json({ token: signToken(user), user: publicUser(user) });
}));

export default router;
