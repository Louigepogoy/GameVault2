import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
}

// Wraps a pg-style client in the same interface as Neon's `sql`: a tagged template
// (values become bound parameters) and sql.query(text, params), both resolving to rows.
function wrap(run) {
  const sql = (strings, ...values) =>
    run(
      strings.slice(1).reduce((text, part, i) => `${text}$${i + 1}${part}`, strings[0]),
      values,
    );
  sql.query = (text, params = []) => run(text, params);
  return sql;
}

// Neon (production) talks HTTP; any other Postgres (e.g. the CI container) uses `pg`;
// "pglite:" runs Postgres in memory inside Node, for tests on machines without Postgres.
async function connect(url) {
  if (url.startsWith('pglite:')) {
    const { PGlite } = await import('@electric-sql/pglite');
    const db = new PGlite();
    return wrap(async (text, params) => (await db.query(text, params)).rows);
  }
  if (/\.neon\.tech\b/.test(url)) return neon(url);
  const { default: pg } = await import('pg');
  const pool = new pg.Pool({ connectionString: url });
  return wrap(async (text, params) => (await pool.query(text, params)).rows);
}

// Use tagged templates or sql.query(text, params); both send values as bound parameters.
export const sql = await connect(process.env.DATABASE_URL);
