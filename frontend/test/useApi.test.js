import { registerEndpoint } from '@nuxt/test-utils/runtime';
import { setResponseStatus } from 'h3';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { friendlyError } from '~/composables/useApi';

// Mock API endpoints (the test config points the app at a relative /api URL).
const respond = (status, body) => (event) => {
  setResponseStatus(event, status);
  return body;
};

describe('friendlyError', () => {
  it("prefers the server's message", () => {
    expect(friendlyError({ data: { error: 'Title is required' }, response: { status: 400 } })).toBe(
      'Title is required',
    );
  });

  it('falls back to the status code', () => {
    expect(friendlyError({ response: { status: 502 } })).toBe('Request failed (502)');
  });

  it('explains a network failure (no response at all)', () => {
    expect(friendlyError(new TypeError('Failed to fetch'))).toMatch(/Could not reach the server/);
  });
});

describe('useApi', () => {
  beforeEach(() => {
    useToast().toasts.value = [];
    useAuth().clearSession();
  });

  it("throws the server's error message", async () => {
    registerEndpoint('/api/games', { method: 'POST', handler: respond(400, { error: 'Title is required' }) });
    await expect(useApi().createGame({})).rejects.toThrow('Title is required');
  });

  it('throws the status code when the server sent no message', async () => {
    registerEndpoint('/api/stats', respond(502, ''));
    await expect(useApi().getStats()).rejects.toThrow('Request failed (502)');
  });

  it('logs out when the session has expired', async () => {
    const { setSession, token } = useAuth();
    setSession({ token: 'expired-token', user: { id: 1, name: 'A', email: 'a@b.co' } });
    registerEndpoint('/api/sessions/active', respond(401, { error: 'Your session has expired' }));
    await expect(useApi().getActiveSession()).rejects.toThrow('Your session has expired');
    expect(token.value).toBeNull();
  });

  it('does not log out on a wrong password (no token was sent)', async () => {
    registerEndpoint('/api/auth/login', {
      method: 'POST',
      handler: respond(401, { error: 'Incorrect email or password' }),
    });
    await expect(useApi().login({ email: 'a@b.co', password: 'x' })).rejects.toThrow(
      'Incorrect email or password',
    );
  });

  it('sends the token and time zone, and strips unlocked achievements after celebrating them', async () => {
    useAuth().setSession({ token: 'good-token', user: { id: 1, name: 'A', email: 'a@b.co' } });
    let headers;
    registerEndpoint('/api/sessions/start', {
      method: 'POST',
      handler: (event) => {
        headers = { auth: event.headers.get('authorization'), tz: event.headers.get('x-timezone') };
        return {
          session: { id: 3 },
          achievements_unlocked: [{ code: 'first_game', title: 'First Steps', icon: '🎮' }],
        };
      },
    });
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    const result = await useApi().startSession(7);
    vi.advanceTimersByTime(10);
    vi.useRealTimers();

    expect(result).toEqual({ session: { id: 3 } });
    expect(headers.auth).toBe('Bearer good-token');
    expect(headers.tz).toEqual(expect.any(String));
    expect(useToast().toasts.value.map((t) => t.message)).toContain('🎮 Achievement unlocked: First Steps');
  });
});
