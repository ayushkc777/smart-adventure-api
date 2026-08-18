import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { NewsletterSubscription } from '../../src/models/NewsletterSubscription.js';
import {
  authHeader,
  createBooking,
  createSupportMessage,
  createUser,
  loginUser,
} from '../helpers/factories.js';

describe('admin, support, newsletter, and uploads api', () => {
  it('prevents admins from removing their own access', async () => {
    const admin = await createUser({ email: 'self-admin@example.com', role: 'admin' });
    const token = await loginUser(admin);

    await request(app)
      .patch(`/api/users/${admin._id}`)
      .set(authHeader(token))
      .send({ role: 'user' })
      .expect(400);

    await request(app).delete(`/api/users/${admin._id}`).set(authHeader(token)).expect(400);
  });

  it('keeps one active admin while allowing safe multi-admin changes', async () => {
    const primaryAdmin = await createUser({ email: 'primary-admin@example.com', role: 'admin' });
    const secondaryAdmin = await createUser({ email: 'secondary-admin@example.com', role: 'admin' });
    const primaryToken = await loginUser(primaryAdmin);

    const demoted = await request(app)
      .patch(`/api/users/${secondaryAdmin._id}`)
      .set(authHeader(primaryToken))
      .send({ role: 'user' })
      .expect(200);
    expect(demoted.body.user.role).toBe('user');

    const suspendSelf = await request(app)
      .patch(`/api/users/${primaryAdmin._id}`)
      .set(authHeader(primaryToken))
      .send({ status: 'suspended' })
      .expect(400);
    const demoteSelf = await request(app)
      .patch(`/api/users/${primaryAdmin._id}`)
      .set(authHeader(primaryToken))
      .send({ role: 'user' })
      .expect(400);

    expect(suspendSelf.body.message).toMatch(/cannot suspend your own/i);
    expect(demoteSelf.body.message).toMatch(/cannot change your own admin role/i);
  });

  it('prevents deletion of the final active admin record', async () => {
    const activeAdmin = await createUser({ email: 'last-active-admin@example.com', role: 'admin' });
    const inactiveAdmin = await createUser({
      email: 'inactive-admin@example.com',
      role: 'admin',
      status: 'suspended',
    });
    const token = await loginUser(activeAdmin);

    await request(app)
      .delete(`/api/users/${activeAdmin._id}`)
      .set(authHeader(token))
      .expect(400);
    const inactiveDeletion = await request(app)
      .delete(`/api/users/${inactiveAdmin._id}`)
      .set(authHeader(token))
      .expect(200);

    expect(inactiveDeletion.body.message).toMatch(/deleted/i);
  });

  it('suspends users with related records instead of hard deleting them', async () => {
    const admin = await createUser({ email: 'delete-user-admin@example.com', role: 'admin' });
    const user = await createUser({ email: 'delete-user@example.com' });
    await createBooking({ user });
    const token = await loginUser(admin);

    const response = await request(app).delete(`/api/users/${user._id}`).set(authHeader(token)).expect(200);

    expect(response.body.message).toMatch(/suspended/i);
    expect(response.body.user.status).toBe('suspended');
  });

  it('stores support messages with phone and lets admins manage them', async () => {
    const admin = await createUser({ email: 'support-admin@example.com', role: 'admin' });
    const token = await loginUser(admin);

    const created = await request(app)
      .post('/api/support')
      .send({
        category: 'booking',
        email: 'guest@example.com',
        message: 'Please help me understand my booking confirmation.',
        name: 'Guest Traveler',
        phone: '9800000000',
        subject: 'Booking question',
      })
      .expect(201);

    expect(created.body.supportMessage.phone).toBe('9800000000');

    const detail = await request(app)
      .get(`/api/support/${created.body.supportMessage._id}`)
      .set(authHeader(token))
      .expect(200);
    expect(detail.body.supportMessage.email).toBe('guest@example.com');

    const updated = await request(app)
      .patch(`/api/support/${created.body.supportMessage._id}`)
      .set(authHeader(token))
      .send({ status: 'resolved' })
      .expect(200);
    expect(updated.body.supportMessage.status).toBe('resolved');

    await request(app).delete(`/api/support/${created.body.supportMessage._id}`).set(authHeader(token)).expect(200);
    await request(app).get(`/api/support/${created.body.supportMessage._id}`).set(authHeader(token)).expect(404);
  });

  it('manages newsletter subscriptions and reports duplicate emails clearly', async () => {
    const admin = await createUser({ email: 'newsletter-admin@example.com', role: 'admin' });
    const token = await loginUser(admin);

    const first = await request(app).post('/api/newsletter').send({ email: 'news@example.com' }).expect(201);
    await request(app).post('/api/newsletter').send({ email: 'news@example.com' }).expect(409);

    const list = await request(app).get('/api/newsletter').set(authHeader(token)).expect(200);
    expect(list.body.subscriptions).toHaveLength(1);

    await request(app)
      .delete(`/api/newsletter/${first.body.subscription._id}`)
      .set(authHeader(token))
      .expect(200);
    expect(await NewsletterSubscription.countDocuments()).toBe(0);
    await request(app).delete(`/api/newsletter/${first.body.subscription._id}`).set(authHeader(token)).expect(404);
  });

  it('denies guest and user access to support administration routes', async () => {
    const user = await createUser({ email: 'support-denied-user@example.com' });
    const token = await loginUser(user);
    const message = await createSupportMessage();
    const routes = [
      ['get', '/api/support'],
      ['get', `/api/support/${message._id}`],
      ['patch', `/api/support/${message._id}`],
      ['delete', `/api/support/${message._id}`],
    ];

    for (const [method, route] of routes) {
      await request(app)[method](route).send({ status: 'resolved' }).expect(401);
      await request(app)[method](route)
        .set(authHeader(token))
        .send({ status: 'resolved' })
        .expect(403);
    }
  });

  it('denies guest and user access to newsletter administration routes', async () => {
    const user = await createUser({ email: 'newsletter-denied-user@example.com' });
    const token = await loginUser(user);
    const subscription = await NewsletterSubscription.create({ email: 'private-list@example.com' });

    for (const [method, route] of [
      ['get', '/api/newsletter'],
      ['delete', `/api/newsletter/${subscription._id}`],
    ]) {
      await request(app)[method](route).expect(401);
      await request(app)[method](route).set(authHeader(token)).expect(403);
    }

    await request(app)
      .post('/api/newsletter')
      .send({ email: 'public-subscription@example.com' })
      .expect(201);
  });

  it('counts revenue only for paid confirmed or completed bookings', async () => {
    const admin = await createUser({ email: 'stats-admin@example.com', role: 'admin' });
    const token = await loginUser(admin);
    await createBooking({ bookingStatus: 'confirmed', paymentStatus: 'paid', totalPrice: 12000 });
    await createBooking({ bookingStatus: 'completed', paymentStatus: 'paid', totalPrice: 14000 });
    await createBooking({ bookingStatus: 'cancelled', paymentStatus: 'paid', totalPrice: 50000 });
    await createBooking({ bookingStatus: 'pending', paymentStatus: 'unpaid', totalPrice: 30000 });
    await createSupportMessage();

    const response = await request(app).get('/api/admin/dashboard').set(authHeader(token)).expect(200);

    expect(response.body.stats.revenue).toBe(26000);
    expect(response.body.stats.pendingSupport).toBe(1);
  });

  it('rejects disguised non-image avatar uploads', async () => {
    const user = await createUser({ email: 'upload-user@example.com' });
    const token = await loginUser(user);

    const response = await request(app)
      .post('/api/users/me/avatar')
      .set(authHeader(token))
      .attach('avatar', Buffer.from('not a real image'), {
        contentType: 'image/png',
        filename: 'avatar.png',
      })
      .expect(400);

    expect(response.body.message).toMatch(/uploaded file content/i);
  });
});
