import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
}

// HTTP-based query function. Use tagged templates or sql.query(text, params);
// both send values as bound parameters.
export const sql = neon(process.env.DATABASE_URL);
