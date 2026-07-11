import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { authHeader, createUser, loginUser, password } from '../helpers/factories.js';

describe('auth api', () => {
  it('returns a health response', async () => {
    const response = await request(app).get('/api/health').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('running');
  });

  it('registers users, hashes passwords, and hides password fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'new-user@example.com',
        fullName: 'New User',
        password,
        phone: '9800000000',
      })
      .expect(201);

    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user.password).toBeUndefined();

    const user = await User.findOne({ email: 'new-user@example.com' }).select('+password');
    expect(user.password).not.toBe(password);
    await expect(user.comparePassword(password)).resolves.toBe(true);
  });

  it('rejects invalid login and returns the current user for valid tokens', async () => {
    const user = await createUser({ email: 'login@example.com' });

    await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'WrongPassword1' })
      .expect(401);

    const token = await loginUser(user);
    const response = await request(app).get('/api/auth/me').set(authHeader(token)).expect(200);

    expect(response.body.user.email).toBe(user.email);
    expect(response.body.user.password).toBeUndefined();
  });

  it('requires admin role for admin endpoints', async () => {
    const user = await createUser({ email: 'normal@example.com' });
    const token = await loginUser(user);

    await request(app).get('/api/admin/dashboard').set(authHeader(token)).expect(403);
    await request(app).get('/api/admin/dashboard').expect(401);
  });
});
