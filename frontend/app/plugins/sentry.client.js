import { scrub, scrubEvent } from '~/utils/scrub';

// Error monitoring in the browser. Only when NUXT_PUBLIC_SENTRY_DSN is set; the Sentry
// code is loaded on demand, so the app doesn't get bigger when monitoring is off.
export default defineNuxtPlugin(async (nuxtApp) => {
  const { sentryDsn, sentryEnvironment } = useRuntimeConfig().public;
  if (!sentryDsn) return;

  const Sentry = await import('@sentry/vue');
  Sentry.init({
    app: nuxtApp.vueApp,
    dsn: sentryDsn,
    environment: sentryEnvironment || (import.meta.dev ? 'development' : 'production'),
    sendDefaultPii: false,
    tracesSampleRate: 0, // errors only
    beforeSend: scrubEvent,
    beforeBreadcrumb: (crumb) => scrub(crumb),
  });

  // Attach the user's id (never email or name) so reports can be grouped per user.
  const { user } = useAuth();
  watch(user, (u) => Sentry.setUser(u ? { id: String(u.id) } : null), { immediate: true });
});
