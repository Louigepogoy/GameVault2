const WEEK = 60 * 60 * 24 * 7; // matches the API token lifetime

export function useAuth() {
  // Captured now: clearSession/logout may run after an await, outside Nuxt's context.
  const nuxtApp = useNuxtApp();

  // Cookies (not localStorage) so the server render knows who is logged in.
  // Secure only over HTTPS, so testing on http://<LAN IP> from a phone still works.
  const cookieOptions = { maxAge: WEEK, sameSite: 'lax', secure: useRequestURL().protocol === 'https:' };
  const tokenCookie = useCookie('gamevault-token', cookieOptions);
  const userCookie = useCookie('gamevault-user', cookieOptions);

  // Shared state, seeded from the cookies.
  const token = useState('auth-token', () => tokenCookie.value || null);
  const user = useState('auth-user', () => (token.value && userCookie.value) || null);

  function setSession(session) {
    token.value = tokenCookie.value = session.token;
    user.value = userCookie.value = session.user;
  }

  function clearSession() {
    token.value = tokenCookie.value = null;
    user.value = userCookie.value = null;
    // Don't show the previous account's data to whoever logs in next.
    nuxtApp.runWithContext(() => clearNuxtData(['games', 'stats']));
    if (import.meta.client && 'caches' in window) caches.delete('gamevault-api').catch(() => {});
  }

  async function logout() {
    clearSession();
    await nuxtApp.runWithContext(() => navigateTo('/login'));
  }

  return {
    token,
    user,
    loggedIn: computed(() => !!token.value && !!user.value),
    setSession,
    clearSession,
    logout,
  };
}
