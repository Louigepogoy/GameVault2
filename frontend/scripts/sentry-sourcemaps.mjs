// Runs after `nuxt build`. Uploads the browser source maps to Sentry so error reports show
// real file names and lines, then deletes the .map files so they're never served publicly.
// Does nothing unless SENTRY_AUTH_TOKEN (plus SENTRY_ORG and SENTRY_PROJECT) is set,
// e.g. as GitHub Actions secrets or Vercel environment variables.
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const { SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT } = process.env;
if (!SENTRY_AUTH_TOKEN) {
  console.log('Sentry: SENTRY_AUTH_TOKEN not set, skipping source map upload.');
  process.exit(0);
}
if (!SENTRY_ORG || !SENTRY_PROJECT) {
  console.warn('Sentry: set SENTRY_ORG and SENTRY_PROJECT to upload source maps. Skipping.');
  process.exit(0);
}

// Node server build and Vercel build put the browser files in different places.
const dirs = ['.output/public/_nuxt', '.vercel/output/static/_nuxt'].filter((d) => existsSync(d));

const sentryCli = (...args) => {
  const { status } = spawnSync('npx', ['--yes', '@sentry/cli', ...args], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (status !== 0) throw new Error(`sentry-cli ${args[0]} ${args[1]} failed`);
};

for (const dir of dirs) {
  sentryCli('sourcemaps', 'inject', dir);
  sentryCli('sourcemaps', 'upload', '--org', SENTRY_ORG, '--project', SENTRY_PROJECT, dir);
  let removed = 0;
  for (const file of readdirSync(dir, { recursive: true })) {
    if (String(file).endsWith('.map')) {
      rmSync(join(dir, String(file)));
      removed++;
    }
  }
  console.log(`Sentry: uploaded source maps from ${dir} and removed ${removed} .map files.`);
}
