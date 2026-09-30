import jwt from 'jsonwebtoken';
import { HttpError } from './validate.js';

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('JWT_SECRET is not set. Add a long random string to .env (see .env.example).');
}

const TOKEN_TTL = '7d';

export const signToken = (user) => jwt.sign({ sub: String(user.id) }, secret, { expiresIn: TOKEN_TTL });

/** Public shape of a user row; never send password_hash to the client. */
export const publicUser = ({ id, name, email, created_at }) => ({ id, name, email, created_at });

/** Requires `Authorization: Bearer <token>` and sets req.userId. */
export function requireAuth(req, _res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return next(new HttpError(401, 'Please log in to continue'));

  try {
    const { sub } = jwt.verify(token, secret);
    req.userId = Number(sub);
    next();
  } catch {
    next(new HttpError(401, 'Your session has expired. Please log in again.'));
  }
}
