import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { Notification } from '../../src/models/Notification.js';
import { authHeader, createUser, loginUser } from '../helpers/factories.js';

describe('notifications api', () => {
  it('lists only the authenticated user notifications', async () => {
    const user = await createUser({ email: 'notifications-owner@example.com' });
    const other = await createUser({ email: 'notifications-other@example.com' });
    const token = await loginUser(user);
    await Notification.create([
      { user: user._id, title: 'Booking update', message: 'Your booking was confirmed.' },
      { user: other._id, title: 'Other update', message: 'Private notification.' },
    ]);

    const response = await request(app)
      .get('/api/notifications')
      .set(authHeader(token))
      .expect(200);

    expect(response.body.notifications).toHaveLength(1);
    expect(response.body.notifications[0].title).toBe('Booking update');
  });

  it('allows admins to create notifications and filter by recipient', async () => {
    const admin = await createUser({ email: 'notifications-admin@example.com', role: 'admin' });
    const user = await createUser({ email: 'notifications-recipient@example.com' });
    const adminToken = await loginUser(admin);
    const userToken = await loginUser(user);

    await request(app)
      .post('/api/notifications')
      .set(authHeader(userToken))
      .send({ user: user._id, title: 'Denied', message: 'Users cannot create notices.' })
      .expect(403);
    const created = await request(app)
      .post('/api/notifications')
      .set(authHeader(adminToken))
      .send({ user: user._id, title: 'Safety reminder', message: 'Review equipment guidance.' })
      .expect(201);
    const list = await request(app)
      .get(`/api/notifications?user=${user._id}`)
      .set(authHeader(adminToken))
      .expect(200);

    expect(created.body.notification.read).toBe(false);
    expect(list.body.notifications).toHaveLength(1);
    expect(list.body.notifications[0].user).toBe(user._id.toString());
  });

  it('paginates notification results with metadata', async () => {
    const user = await createUser({ email: 'notifications-pages@example.com' });
    const token = await loginUser(user);
    await Notification.create([
      { user: user._id, title: 'Notice one', message: 'First message.' },
      { user: user._id, title: 'Notice two', message: 'Second message.' },
      { user: user._id, title: 'Notice three', message: 'Third message.' },
    ]);

    const response = await request(app)
      .get('/api/notifications?page=2&limit=2')
      .set(authHeader(token))
      .expect(200);

    expect(response.body.notifications).toHaveLength(1);
    expect(response.body.pagination).toEqual({ limit: 2, page: 2, pages: 2, total: 3 });

    await request(app)
      .get('/api/notifications?page=0&limit=101')
      .set(authHeader(token))
      .expect(422);
  });

  it('enforces ownership for read updates and deletion with admin override', async () => {
    const owner = await createUser({ email: 'notification-action-owner@example.com' });
    const other = await createUser({ email: 'notification-action-other@example.com' });
    const admin = await createUser({ email: 'notification-action-admin@example.com', role: 'admin' });
    const ownerToken = await loginUser(owner);
    const otherToken = await loginUser(other);
    const adminToken = await loginUser(admin);
    const notification = await Notification.create({
      user: owner._id,
      title: 'Trip reminder',
      message: 'Bring your identification.',
    });

    await request(app)
      .patch(`/api/notifications/${notification._id}`)
      .set(authHeader(otherToken))
      .send({ read: true })
      .expect(403);
    await request(app)
      .delete(`/api/notifications/${notification._id}`)
      .set(authHeader(otherToken))
      .expect(403);

    const updated = await request(app)
      .patch(`/api/notifications/${notification._id}`)
      .set(authHeader(ownerToken))
      .send({ read: true })
      .expect(200);
    expect(updated.body.notification.read).toBe(true);

    await request(app)
      .delete(`/api/notifications/${notification._id}`)
      .set(authHeader(adminToken))
      .expect(200);
    expect(await Notification.findById(notification._id)).toBeNull();
  });
});
