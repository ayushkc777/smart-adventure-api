import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { Activity } from '../../src/models/Activity.js';
import { Booking } from '../../src/models/Booking.js';
import {
  authHeader,
  createActivity,
  createBooking,
  createOperator,
  createReview,
  createUser,
  futureDate,
  loginUser,
} from '../helpers/factories.js';

describe('bookings and reviews api', () => {
  it('creates bookings for authenticated users and calculates total price', async () => {
    const user = await createUser({ email: 'booking-user@example.com' });
    const token = await loginUser(user);
    const operator = await createOperator();
    const activity = await createActivity({ operator });

    const response = await request(app)
      .post('/api/bookings')
      .set(authHeader(token))
      .send({
        activity: activity._id.toString(),
        date: futureDate(),
        emergencyContact: { name: 'Backup Contact', phone: '9811111111' },
        extras: ['photo-video'],
        operator: operator._id.toString(),
        travellers: {
          count: 3,
          email: user.email,
          leadName: user.fullName,
          phone: user.phone,
        },
      })
      .expect(201);

    expect(response.body.booking.bookingStatus).toBe('awaiting_payment');
    expect(response.body.booking.totalPrice).toBe(9500 * 3 + 500);
  });

  it('restricts booking access to the owner or admin and supports status updates', async () => {
    const owner = await createUser({ email: 'booking-owner@example.com' });
    const otherUser = await createUser({ email: 'booking-other@example.com' });
    const admin = await createUser({ email: 'booking-admin@example.com', role: 'admin' });
    const operator = await createOperator();
    const activity = await createActivity({ operator });
    const booking = await createBooking({ activity, operator, user: owner });
    const ownerToken = await loginUser(owner);
    const otherToken = await loginUser(otherUser);
    const adminToken = await loginUser(admin);

    await request(app).get(`/api/bookings/${booking._id}`).set(authHeader(otherToken)).expect(403);
    await request(app).get(`/api/bookings/${booking._id}`).set(authHeader(ownerToken)).expect(200);

    const statusResponse = await request(app)
      .patch(`/api/bookings/${booking._id}/status`)
      .set(authHeader(adminToken))
      .send({ bookingStatus: 'confirmed', paymentStatus: 'paid' })
      .expect(200);

    expect(statusResponse.body.booking.bookingStatus).toBe('confirmed');
    expect(statusResponse.body.booking.paymentStatus).toBe('paid');
  });

  it('denies booking updates and cancellation by another user', async () => {
    const owner = await createUser({ email: 'booking-write-owner@example.com' });
    const otherUser = await createUser({ email: 'booking-write-other@example.com' });
    const booking = await createBooking({ user: owner });
    const otherToken = await loginUser(otherUser);

    const updateResponse = await request(app)
      .patch(`/api/bookings/${booking._id}`)
      .set(authHeader(otherToken))
      .send({ date: futureDate(30) })
      .expect(403);
    const cancelResponse = await request(app)
      .patch(`/api/bookings/${booking._id}/cancel`)
      .set(authHeader(otherToken))
      .expect(403);

    expect(updateResponse.body.message).toBe('You cannot update this booking.');
    expect(cancelResponse.body.message).toBe('You cannot cancel this booking.');
    const unchangedBooking = await Booking.findById(booking._id);
    expect(unchangedBooking.bookingStatus).toBe('awaiting_payment');
  });

  it('prevents owners from editing completed or cancelled bookings', async () => {
    const owner = await createUser({ email: 'immutable-owner@example.com' });
    const ownerToken = await loginUser(owner);
    const completed = await createBooking({ bookingStatus: 'completed', user: owner });
    const cancelled = await createBooking({ bookingStatus: 'cancelled', user: owner });

    for (const booking of [completed, cancelled]) {
      const response = await request(app)
        .patch(`/api/bookings/${booking._id}`)
        .set(authHeader(ownerToken))
        .send({ date: futureDate(45) })
        .expect(400);

      expect(response.body.message).toMatch(/cannot be updated/i);
    }
  });

  it('requires confirmed and completed bookings to be cancelled instead of deleted', async () => {
    const admin = await createUser({ email: 'immutable-admin@example.com', role: 'admin' });
    const adminToken = await loginUser(admin);
    const confirmed = await createBooking({ bookingStatus: 'confirmed' });
    const completed = await createBooking({ bookingStatus: 'completed' });

    for (const booking of [confirmed, completed]) {
      const response = await request(app)
        .delete(`/api/bookings/${booking._id}`)
        .set(authHeader(adminToken))
        .expect(400);

      expect(response.body.message).toMatch(/cancelled instead of deleted/i);
    }
  });

  it('refunds paid bookings when they are cancelled', async () => {
    const owner = await createUser({ email: 'refund-owner@example.com' });
    const ownerToken = await loginUser(owner);
    const booking = await createBooking({
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      user: owner,
    });

    const response = await request(app)
      .patch(`/api/bookings/${booking._id}/cancel`)
      .set(authHeader(ownerToken))
      .expect(200);

    expect(response.body.booking).toMatchObject({
      bookingStatus: 'cancelled',
      paymentStatus: 'refunded',
    });
  });

  it('requires a completed booking before review creation and prevents duplicates', async () => {
    const user = await createUser({ email: 'reviewer@example.com' });
    const token = await loginUser(user);
    const operator = await createOperator();
    const wrongOperator = await createOperator();
    const activity = await createActivity({ operator });

    await request(app)
      .post('/api/reviews')
      .set(authHeader(token))
      .send({
        activity: activity._id.toString(),
        comment: 'Clear safety briefing.',
        operator: wrongOperator._id.toString(),
        rating: 5,
        safetyRating: 5,
      })
      .expect(400);

    await request(app)
      .post('/api/reviews')
      .set(authHeader(token))
      .send({
        activity: activity._id.toString(),
        comment: 'Clear safety briefing.',
        operator: operator._id.toString(),
        rating: 5,
        safetyRating: 5,
      })
      .expect(403);

    await createBooking({
      activity,
      bookingStatus: 'completed',
      operator,
      paymentStatus: 'paid',
      user,
    });

    const created = await request(app)
      .post('/api/reviews')
      .set(authHeader(token))
      .send({
        activity: activity._id.toString(),
        comment: 'Clear safety briefing and fair pricing.',
        operator: operator._id.toString(),
        rating: 5,
        safetyRating: 5,
      })
      .expect(201);

    expect(created.body.review.rating).toBe(5);

    await request(app)
      .post('/api/reviews')
      .set(authHeader(token))
      .send({
        activity: activity._id.toString(),
        comment: 'Second review attempt.',
        operator: operator._id.toString(),
        rating: 4,
        safetyRating: 4,
      })
      .expect(409);

    const updatedActivity = await Activity.findById(activity._id);
    expect(updatedActivity.reviewCount).toBe(1);
    expect(updatedActivity.ratingAverage).toBe(5);
  });

  it('recalculates activity metrics when reviews are deleted', async () => {
    const admin = await createUser({ email: 'review-admin@example.com', role: 'admin' });
    const adminToken = await loginUser(admin);
    const user = await createUser({ email: 'review-delete-user@example.com' });
    const operator = await createOperator();
    const activity = await createActivity({ operator });
    const review = await createReview({ activity, operator, user });

    await request(app).delete(`/api/reviews/${review._id}`).set(authHeader(adminToken)).expect(200);

    const updatedActivity = await Activity.findById(activity._id);
    expect(updatedActivity.reviewCount).toBe(0);
    expect(updatedActivity.ratingAverage).toBe(0);
  });
});
