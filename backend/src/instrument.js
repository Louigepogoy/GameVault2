// Error monitoring. Only turned on when SENTRY_DSN is set; otherwise this does nothing.
import 'dotenv/config';
import * as Sentry from '@sentry/node';
import { scrubBreadcrumb, scrubEvent } from './scrub.js';

export const sentryEnabled = Boolean(process.env.SENTRY_DSN) && process.env.NODE_ENV !== 'test';

if (sentryEnabled) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment:
      process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    sendDefaultPii: false, // no IP addresses, cookies or request bodies
    tracesSampleRate: 0, // errors only
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  });
}

/** Report an unexpected error (no-op when Sentry is off). */
export async function reportError(err, req) {
  if (!sentryEnabled) return;
  Sentry.withScope((scope) => {
    if (req?.userId) scope.setUser({ id: String(req.userId) });
    scope.setTag('route', `${req?.method} ${req?.route?.path ?? req?.path ?? ''}`);
    Sentry.captureException(err);
  });
  // Serverless functions can freeze right after responding; send it first.
  await Sentry.flush(2000);
}
