import fs from 'node:fs/promises';
import path from 'node:path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { User } from '../../src/models/User.js';
import { authHeader, createUser, loginUser, password } from '../helpers/factories.js';

describe('profile and password api', () => {
  it('updates allowed profile fields and ignores privileged fields', async () => {
    const user = await createUser({ email: 'profile-update@example.com' });
    const token = await loginUser(user);

    const response = await request(app)
      .patch('/api/users/me')
      .set(authHeader(token))
      .send({
        fullName: 'Updated Traveler',
        nationality: 'Nepali',
        phone: '9812345678',
        preferredLanguage: 'Nepali',
        role: 'admin',
        status: 'suspended',
      })
      .expect(200);

    expect(response.body.user).toMatchObject({
      fullName: 'Updated Traveler',
      nationality: 'Nepali',
      phone: '9812345678',
      preferredLanguage: 'Nepali',
      role: 'user',
      status: 'active',
    });
    expect(response.body.user.password).toBeUndefined();
  });

  it('rejects an incorrect current password', async () => {
    const user = await createUser({ email: 'profile-wrong-password@example.com' });
    const token = await loginUser(user);

    const response = await request(app)
      .patch('/api/users/me/password')
      .set(authHeader(token))
      .send({ currentPassword: 'WrongPassword1', newPassword: 'NewPassword123' })
      .expect(401);

    expect(response.body.message).toBe('Current password is incorrect.');
  });

  it('hashes a changed password and accepts only the new login', async () => {
    const user = await createUser({ email: 'profile-new-password@example.com' });
    const token = await loginUser(user);
    const newPassword = 'NewPassword123';

    await request(app)
      .patch('/api/users/me/password')
      .set(authHeader(token))
      .send({ currentPassword: password, newPassword })
      .expect(200);
    await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password })
      .expect(401);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: newPassword })
      .expect(200);
    const storedUser = await User.findById(user._id).select('+password');

    expect(login.body.user.password).toBeUndefined();
    expect(storedUser.password).not.toBe(newPassword);
    await expect(storedUser.comparePassword(newPassword)).resolves.toBe(true);
  });

  it('removes the avatar path from the authenticated profile', async () => {
    const avatarDirectory = path.join(process.cwd(), env.UPLOAD_DIR, 'avatars');
    const avatarPath = path.join(avatarDirectory, 'existing.png');
    await fs.mkdir(avatarDirectory, { recursive: true });
    await fs.writeFile(avatarPath, 'avatar');
    const user = await createUser({
      avatar: '/uploads/avatars/existing.png',
      email: 'profile-avatar@example.com',
    });
    const token = await loginUser(user);

    const response = await request(app)
      .delete('/api/users/me/avatar')
      .set(authHeader(token))
      .expect(200);

    expect(response.body.user.avatar).toBe('');
    expect((await User.findById(user._id)).avatar).toBe('');
    await expect(fs.access(avatarPath)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('does not delete avatar paths outside the managed upload folder', async () => {
    const outsidePath = path.join(process.cwd(), env.UPLOAD_DIR, 'outside-avatar.png');
    await fs.mkdir(path.dirname(outsidePath), { recursive: true });
    await fs.writeFile(outsidePath, 'avatar');
    const user = await createUser({
      avatar: '/uploads/outside-avatar.png',
      email: 'profile-external-avatar@example.com',
    });
    const token = await loginUser(user);

    await request(app).delete('/api/users/me/avatar').set(authHeader(token)).expect(200);

    await expect(fs.access(outsidePath)).resolves.toBeUndefined();
    await fs.rm(outsidePath);
  });

  it('requires authentication for profile self-service routes', async () => {
    await request(app).patch('/api/users/me').send({ fullName: 'Guest' }).expect(401);
    await request(app)
      .patch('/api/users/me/password')
      .send({ currentPassword: password, newPassword: 'NewPassword123' })
      .expect(401);
    await request(app).delete('/api/users/me/avatar').expect(401);
  });
});
