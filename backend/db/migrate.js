import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

/** Apply db/schema.sql (every statement is safe to re-run). Returns the statement count. */
export async function applySchema(sql) {
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
  return statements.length;
}

// `npm run db:schema`
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { sql } = await import('../src/db.js');
  console.log(`Schema applied (${await applySchema(sql)} statements).`);
}
