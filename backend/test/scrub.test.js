import { describe, expect, it } from 'vitest';
import { scrub, scrubEvent } from '../src/scrub.js';

describe('error report scrubbing', () => {
  it('blanks secret-looking fields at any depth', () => {
    const out = scrub({
      password: 'hunter2',
      nested: { newPassword: 'x', access_token: 'abc', apiKey: 'k', Authorization: 'Bearer t' },
      list: [{ secret: 's' }],
      title: 'Hades',
    });
    expect(out).toEqual({
      password: '[Filtered]',
      nested: {
        newPassword: '[Filtered]',
        access_token: '[Filtered]',
        apiKey: '[Filtered]',
        Authorization: '[Filtered]',
      },
      list: [{ secret: '[Filtered]' }],
      title: 'Hades',
    });
  });

  it('masks email addresses inside any text', () => {
    expect(scrub('Login failed for juan.dela.cruz+test@example.com twice')).toBe(
      'Login failed for [email] twice',
    );
  });

  it('blanks secrets written inside text', () => {
    expect(scrub('GET /reset-password?token=0123abcd&x=1')).toBe('GET /reset-password?token=[Filtered]&x=1');
    expect(scrub('failed with password=hunter2 ok')).toBe('failed with password=[Filtered] ok');
    expect(scrub('header Bearer eyJhbGciOi.payload.sig was rejected')).toBe(
      'header Bearer [Filtered] was rejected',
    );
  });

  it('keeps only the user id and drops request bodies and cookies', () => {
    const event = scrubEvent({
      user: { id: '42', email: 'a@b.co', ip_address: '1.2.3.4' },
      request: {
        url: 'https://api.example.com/api/auth/login',
        data: { email: 'a@b.co', password: 'x' },
        cookies: { session: 'y' },
        headers: { Authorization: 'Bearer z', 'User-Agent': 'test' },
      },
      exception: { values: [{ value: 'duplicate key for a@b.co' }] },
    });
    expect(event.user).toEqual({ id: '42' });
    expect(event.request.data).toBeUndefined();
    expect(event.request.cookies).toBeUndefined();
    expect(event.request.headers).toEqual({ Authorization: '[Filtered]', 'User-Agent': 'test' });
    expect(event.exception.values[0].value).toBe('duplicate key for [email]');
  });
});
