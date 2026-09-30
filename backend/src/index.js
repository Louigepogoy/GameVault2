import 'dotenv/config';
import { reportError } from './instrument.js'; // first, so error monitoring is ready early
import express from 'express';
import cors from 'cors';
import gamesRouter from './routes/games.js';
import statsRouter from './routes/stats.js';
import authRouter from './routes/auth.js';
import discoverRouter from './routes/discover.js';
import lookupRouter from './routes/lookup.js';
import sessionsRouter from './routes/sessions.js';
import achievementsRouter from './routes/achievements.js';
import { requireAuth } from './auth.js';
import { HttpError } from './validate.js';

const app = express();
// Behind Render's proxy: use the real client IP (for the login rate limiter).
app.set('trust proxy', 1);

const origins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors(origins.length ? { origin: origins } : {}));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/games', requireAuth, gamesRouter);
app.use('/api/stats', requireAuth, statsRouter);
app.use('/api/discover', requireAuth, discoverRouter);
app.use('/api/lookup', requireAuth, lookupRouter);
app.use('/api/sessions', requireAuth, sessionsRouter);
app.use('/api/achievements', requireAuth, achievementsRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler: always respond with JSON.
app.use(async (err, req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  const status = err.status || 500;
  // Hide details of unexpected crashes, but keep messages we threw on purpose.
  const expected = err instanceof HttpError;
  if (!expected) {
    console.error(err);
    await reportError(err, req).catch(() => {}); // reporting must never break the response
  }
  res.status(status).json({ error: expected || status < 500 ? err.message : 'Internal server error' });
});

// Tests import the app without starting a server.
if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT) || 4000;
  app.listen(port, () => console.log(`GameVault API listening on http://localhost:${port}`));
}

export default app;
