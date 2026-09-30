import request from 'supertest';
import { afterAll } from 'vitest';
import app from '../src/index.js';
import { sql } from '../src/db.js';
import { applySchema } from '../db/migrate.js';

export { sql };
export const api = () => request(app);

// Close this file's database connection when its tests are done.
afterAll(() => sql.end?.());

let schemaReady;
/** Create the tables once, then empty them. Call in beforeAll of every test file. */
export async function resetDb() {
  schemaReady ||= applySchema(sql);
  await schemaReady;
  await sql.query(
    'TRUNCATE users, games, play_sessions, password_resets, user_achievements RESTART IDENTITY CASCADE',
  );
}

let n = 0;
/** Register a user and return { token, user, auth } where auth is the Authorization header. */
export async function createUser({ name = 'Tester', password = 'secret123', email } = {}) {
  n += 1;
  const res = await api()
    .post('/api/auth/register')
    .send({ name, email: email ?? `user${n}-${Date.now()}@example.com`, password });
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { ...res.body, password, auth: { Authorization: `Bearer ${res.body.token}` } };
}

export async function createGame(auth, game = {}) {
  const res = await api()
    .post('/api/games')
    .set(auth)
    .send({ title: 'Test Game', ...game });
  if (res.status !== 201) throw new Error(`create game failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body;
}
