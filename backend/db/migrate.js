import { readFile } from 'node:fs/promises';
import { sql } from '../src/db.js';

const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');

// The HTTP driver runs one statement per call, so split on semicolons.
const statements = schema
  .replace(/--.*$/gm, '')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
}
console.log(`Schema applied (${statements.length} statements).`);
