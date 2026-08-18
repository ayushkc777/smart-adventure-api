import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import {
  authHeader,
  createActivity,
  createBooking,
  createOperator,
  createReview,
  createSupportMessage,
  createUser,
  loginUser,
} from '../helpers/factories.js';

describe('empty update validation', () => {
  it('rejects empty activity and operator updates', async () => {
    const admin = await createUser({ email: 'empty-catalog-admin@example.com', role: 'admin' });
    const token = await loginUser(admin);
    const operator = await createOperator();
    const activity = await createActivity({ operator });

    for (const route of [
      `/api/activities/${activity._id}`,
      `/api/operators/${operator._id}`,
    ]) {
      const response = await request(app)
        .patch(route)
        .set(authHeader(token))
        .send({})
        .expect(422);
      expect(response.body.errors[0].message).toBe('At least one supported field is required.');
    }
  });

  it('rejects empty booking and status updates', async () => {
    const owner = await createUser({ email: 'empty-booking-owner@example.com' });
    const admin = await createUser({ email: 'empty-booking-admin@example.com', role: 'admin' });
    const booking = await createBooking({ user: owner });
    const ownerToken = await loginUser(owner);
    const adminToken = await loginUser(admin);

    await request(app)
      .patch(`/api/bookings/${booking._id}`)
      .set(authHeader(ownerToken))
      .send({})
      .expect(422);
    await request(app)
      .patch(`/api/bookings/${booking._id}/status`)
      .set(authHeader(adminToken))
      .send({ unknown: true })
      .expect(422);
  });

  it('rejects empty review, profile, admin-user, and support updates', async () => {
    const admin = await createUser({ email: 'empty-resource-admin@example.com', role: 'admin' });
    const user = await createUser({ email: 'empty-resource-user@example.com' });
    const operator = await createOperator();
    const activity = await createActivity({ operator });
    const review = await createReview({ activity, operator, user });
    const supportMessage = await createSupportMessage();
    const adminToken = await loginUser(admin);
    const userToken = await loginUser(user);

    await request(app)
      .patch(`/api/reviews/${review._id}`)
      .set(authHeader(userToken))
      .send({})
      .expect(422);
    await request(app)
      .patch('/api/users/me')
      .set(authHeader(userToken))
      .send({ ignored: true })
      .expect(422);
    await request(app)
      .patch(`/api/users/${user._id}`)
      .set(authHeader(adminToken))
      .send({})
      .expect(422);
    await request(app)
      .patch(`/api/support/${supportMessage._id}`)
      .set(authHeader(adminToken))
      .send({})
      .expect(422);
  });
});
