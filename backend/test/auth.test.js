import jwt from 'jsonwebtoken';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, createUser, resetDb, sql } from './helpers.js';

// Capture reset emails instead of sending them.
vi.mock('../src/mailer.js', () => ({ sendPasswordResetEmail: vi.fn() }));
const { sendPasswordResetEmail } = await import('../src/mailer.js');

beforeAll(resetDb);
beforeEach(() => sendPasswordResetEmail.mockClear());

describe('register', () => {
  it('creates an account and returns a token without the password hash', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ name: '  Juan  ', email: 'Juan@Example.com', password: 'secret123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ name: 'Juan', email: 'juan@example.com' });
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('rejects a duplicate email regardless of case', async () => {
    await createUser({ email: 'dupe@example.com' });
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'Other', email: 'DUPE@example.com', password: 'secret123' });
    expect(res.status).toBe(409);
  });

  it.each([
    [{ email: 'a@b.co', password: 'secret123' }, 'Name is required'],
    [{ name: 'A', email: 'not-an-email', password: 'secret123' }, 'valid email'],
    [{ name: 'A', email: 'a@b.co', password: 'short' }, 'at least 8'],
  ])('validates input %#', async (body, message) => {
    const res = await api().post('/api/auth/register').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain(message);
  });
});

describe('login', () => {
  it('logs in with the right password (email is case-insensitive)', async () => {
    const u = await createUser({ email: 'login@example.com' });
    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'LOGIN@example.com', password: u.password });
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(u.user.id);
  });

  it('gives the same error for a wrong password and an unknown email', async () => {
    await createUser({ email: 'known@example.com' });
    const wrong = await api()
      .post('/api/auth/login')
      .send({ email: 'known@example.com', password: 'wrongpass1' });
    const unknown = await api()
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'wrongpass1' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error).toBe(unknown.body.error);
  });
});

describe('requireAuth', () => {
  it('rejects a missing token', async () => {
    const res = await api().get('/api/games');
    expect(res.status).toBe(401);
  });

  it.each([
    ['garbage', 'Bearer not-a-jwt'],
    ['wrong scheme', 'Basic abc'],
    ['wrong secret', `Bearer ${jwt.sign({ sub: '1' }, 'some-other-secret')}`],
    [
      'expired',
      `Bearer ${jwt.sign({ sub: '1', exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET)}`,
    ],
  ])('rejects an invalid token (%s)', async (_label, header) => {
    const res = await api().get('/api/games').set('Authorization', header);
    expect(res.status).toBe(401);
  });

  it('rejects the token of a deleted user on /me', async () => {
    const u = await createUser();
    await sql`DELETE FROM users WHERE id = ${u.user.id}`;
    const res = await api().get('/api/auth/me').set(u.auth);
    expect(res.status).toBe(401);
  });
});

describe('forgot and reset password', () => {
  it('answers the same way for unknown emails and sends nothing', async () => {
    const res = await api().post('/api/auth/forgot-password').send({ email: 'ghost@example.com' });
    expect(res.status).toBe(200);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('resets the password once with the emailed link', async () => {
    const u = await createUser({ email: 'forgot@example.com' });
    const res = await api().post('/api/auth/forgot-password').send({ email: 'forgot@example.com' });
    expect(res.status).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalledOnce();
    const { link } = sendPasswordResetEmail.mock.calls[0][0];
    const token = new URL(link).searchParams.get('token');

    const reset = await api().post('/api/auth/reset-password').send({ token, password: 'brandnew123' });
    expect(reset.status).toBe(200);
    expect(reset.body.token).toEqual(expect.any(String));

    const oldLogin = await api().post('/api/auth/login').send({ email: u.user.email, password: u.password });
    const newLogin = await api()
      .post('/api/auth/login')
      .send({ email: u.user.email, password: 'brandnew123' });
    expect(oldLogin.status).toBe(401);
    expect(newLogin.status).toBe(200);

    const again = await api().post('/api/auth/reset-password').send({ token, password: 'another123' });
    expect(again.status).toBe(400);
  });

  it('rejects an expired or malformed reset token', async () => {
    await createUser({ email: 'expired@example.com' });
    await api().post('/api/auth/forgot-password').send({ email: 'expired@example.com' });
    const token = new URL(sendPasswordResetEmail.mock.calls[0][0].link).searchParams.get('token');
    await sql`UPDATE password_resets SET expires_at = now() - interval '1 minute'`;

    const expired = await api().post('/api/auth/reset-password').send({ token, password: 'brandnew123' });
    const malformed = await api()
      .post('/api/auth/reset-password')
      .send({ token: 'abc', password: 'brandnew123' });
    expect(expired.status).toBe(400);
    expect(malformed.status).toBe(400);
  });
});
