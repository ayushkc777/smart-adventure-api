import request from 'supertest';
import jwt from 'jsonwebtoken';
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

  it('rejects malformed and incorrectly signed bearer tokens', async () => {
    const malformed = await request(app)
      .get('/api/auth/me')
      .set(authHeader('not-a-jwt'))
      .expect(401);
    const wrongSignature = jwt.sign({ id: '507f1f77bcf86cd799439011' }, 'wrong-secret');

    await request(app).get('/api/auth/me').set(authHeader(wrongSignature)).expect(401);
    expect(malformed.body.success).toBe(false);
    expect(malformed.body.message).toMatch(/token|invalid/i);
  });

  it('rejects expired bearer tokens', async () => {
    const user = await createUser({ email: 'expired-token@example.com' });
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: -1 },
    );

    const response = await request(app)
      .get('/api/auth/me')
      .set(authHeader(token))
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/expired/i);
  });

  it('rejects sessions after an account is suspended', async () => {
    const user = await createUser({ email: 'suspended-session@example.com' });
    const token = await loginUser(user);
    user.status = 'suspended';
    await user.save();

    const response = await request(app)
      .get('/api/auth/me')
      .set(authHeader(token))
      .expect(403);

    expect(response.body.message).toBe('Account is not active.');
  });

  it('rejects sessions whose user has been deleted', async () => {
    const user = await createUser({ email: 'deleted-session@example.com' });
    const token = await loginUser(user);
    await User.deleteOne({ _id: user._id });

    const response = await request(app)
      .get('/api/auth/me')
      .set(authHeader(token))
      .expect(401);

    expect(response.body.message).toBe('Authenticated user no longer exists.');
  });

  it('sets secure authentication cookie attributes on registration and login', async () => {
    const registration = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'cookie-register@example.com',
        fullName: 'Cookie User',
        password,
        phone: '9800000000',
      })
      .expect(201);
    const registeredCookie = registration.headers['set-cookie'][0];

    expect(registeredCookie).toContain('token=');
    expect(registeredCookie).toContain('HttpOnly');
    expect(registeredCookie).toContain('SameSite=Lax');
    expect(registeredCookie).toContain('Max-Age=604800');

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cookie-register@example.com', password })
      .expect(200);
    expect(login.headers['set-cookie'][0]).toContain('HttpOnly');
  });

  it('clears the authentication cookie on logout', async () => {
    const user = await createUser({ email: 'cookie-logout@example.com' });
    const token = await loginUser(user);
    const response = await request(app)
      .post('/api/auth/logout')
      .set(authHeader(token))
      .expect(200);
    const cookie = response.headers['set-cookie'][0];

    expect(cookie).toContain('token=;');
    expect(cookie).toContain('Expires=Thu, 01 Jan 1970');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });
});
