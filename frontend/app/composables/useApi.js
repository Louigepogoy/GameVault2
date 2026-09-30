/** Turn a failed request into a message a person can act on. */
export function friendlyError(err) {
  if (err?.data?.error) return err.data.error;
  if (err?.response) return `Request failed (${err.response.status})`;
  return 'Could not reach the server. Check your connection.';
}

export function useApi() {
  const { apiUrl } = useRuntimeConfig().public;
  const baseURL = `${apiUrl.replace(/\/+$/, '')}/api`;
  const { token, logout } = useAuth();
  const { celebrate } = useAchievements();
  // The browser's time zone, so time-of-day things (like "Night Owl") use local time.
  const timeZone = import.meta.client ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;

  async function request(path, options = {}) {
    const sentToken = token.value;
    try {
      const data = await $fetch(path, {
        baseURL,
        ...options,
        headers: {
          ...options.headers,
          ...(sentToken && { Authorization: `Bearer ${sentToken}` }),
          ...(timeZone && { 'X-Timezone': timeZone }),
        },
      });
      // Any response can carry newly unlocked achievements: celebrate, then hand back the rest.
      if (data && typeof data === 'object' && !Array.isArray(data) && 'achievements_unlocked' in data) {
        const { achievements_unlocked, ...rest } = data;
        celebrate(achievements_unlocked);
        return rest;
      }
      return data;
    } catch (err) {
      // Expired or invalid session: sign out and go to the login page.
      if (err.response?.status === 401 && sentToken) await logout();
      throw new Error(friendlyError(err), { cause: err });
    }
  }

  return {
    register: (body) => request('/auth/register', { method: 'POST', body }),
    login: (body) => request('/auth/login', { method: 'POST', body }),
    googleLogin: (credential) => request('/auth/google', { method: 'POST', body: { credential } }),
    forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
    resetPassword: (body) => request('/auth/reset-password', { method: 'POST', body }),

    listGames({ q = '', status = '', sort = '', favorite = false } = {}) {
      const query = {};
      if (q) query.q = q;
      if (status) query.status = status;
      if (sort && sort !== 'newest') query.sort = sort;
      if (favorite) query.favorite = '1';
      return request('/games', { query });
    },
    getStats: () => request('/stats'),
    getDiscover: () => request('/discover'),
    lookupGames: (q) => request('/lookup', { query: { q } }),

    // Play sessions
    getActiveSession: () => request('/sessions/active'),
    startSession: (gameId) => request('/sessions/start', { method: 'POST', body: { game_id: gameId } }),
    stopSession: (id, note) => request(`/sessions/${id}/stop`, { method: 'POST', body: note ? { note } : {} }),
    updateSessionNote: (id, note) => request(`/sessions/${id}`, { method: 'PATCH', body: { note } }),
    discardSession: (id) => request(`/sessions/${id}`, { method: 'DELETE' }),
    listSessions: ({ gameId, page = 1, limit = 10 } = {}) =>
      request('/sessions', { query: { ...(gameId && { game_id: gameId }), page, limit } }),
    getHeatmap: ({ weeks = 15, tz } = {}) => request('/stats/heatmap', { query: { weeks, ...(tz && { tz }) } }),
    getAchievements: () => request('/achievements'),
    createGame: (game) => request('/games', { method: 'POST', body: game }),
    updateGame: (id, patch) => request(`/games/${id}`, { method: 'PATCH', body: patch }),
    deleteGame: (id) => request(`/games/${id}`, { method: 'DELETE' }),
    // For when the tab is closing: keepalive lets the request finish after the page is gone.
    deleteGameOnExit(id) {
      if (!token.value) return;
      fetch(`${baseURL}/games/${id}`, {
        method: 'DELETE',
        keepalive: true,
        headers: { Authorization: `Bearer ${token.value}` },
      }).catch(() => {});
    },
  };
}
