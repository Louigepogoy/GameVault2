import { Router } from 'express';
import { sql } from '../db.js';
import { publicUser } from '../auth.js';
import { HttpError, validateProfileUpdate } from '../validate.js';

const router = Router();

// PATCH /api/me { favorite_platforms?, favorite_genres?, onboarding_completed? } -> { user }
// Preferences from onboarding/settings, and the onboarding flag ("Redo onboarding" sets false).
router.patch('/', async (req, res, next) => {
  try {
    const u = validateProfileUpdate(req.body);
    const [user] = await sql`
      UPDATE users SET
        favorite_platforms = COALESCE(${u.favorite_platforms ?? null}::text[], favorite_platforms),
        favorite_genres = COALESCE(${u.favorite_genres ?? null}::text[], favorite_genres),
        onboarding_completed = COALESCE(${u.onboarding_completed ?? null}::boolean, onboarding_completed)
      WHERE id = ${req.userId}
      RETURNING *
    `;
    if (!user) throw new HttpError(401, 'Your session has expired. Please log in again.');
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

export default router;
