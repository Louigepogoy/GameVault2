import { Router } from 'express';
import { evaluateAchievements, listAchievements } from '../achievements.js';
import { requestTimeZone } from '../validate.js';

const router = Router();

// GET /api/achievements -> { achievements: [...with unlocked + progress], achievements_unlocked }
// Checks first, so anything earned before achievements existed unlocks the first time you look.
router.get('/', async (req, res, next) => {
  try {
    const tz = requestTimeZone(req);
    const achievements_unlocked = await evaluateAchievements(req.userId, tz);
    res.json({ achievements: await listAchievements(req.userId, tz), achievements_unlocked });
  } catch (err) {
    next(err);
  }
});

export default router;
