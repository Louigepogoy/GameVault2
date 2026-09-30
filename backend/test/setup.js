// Runs before every test file, before the app (and src/db.js) is imported.
import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ||= 'test-jwt-secret-not-for-production';
process.env.AUTH_RATE_LIMIT_MAX = '100000'; // tests sign up many users from one address
process.env.SMTP_HOST = ''; // never send real email from tests

const testUrl = process.env.TEST_DATABASE_URL || 'pglite://memory';

// Tests wipe the database. Refuse to run against the real one from .env.
let realUrl;
try {
  realUrl = parse(readFileSync(new URL('../.env', import.meta.url))).DATABASE_URL;
} catch {
  // no .env (e.g. in CI)
}
if (realUrl && testUrl === realUrl) {
  throw new Error('TEST_DATABASE_URL is the same as DATABASE_URL. Tests delete data; use a separate database.');
}

process.env.DATABASE_URL = testUrl;
