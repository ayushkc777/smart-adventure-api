import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { authHeader, createActivity, createUser, loginUser } from '../helpers/factories.js';

describe('wishlist api', () => {
  it('adds activities idempotently and removes them', async () => {
    const user = await createUser({ email: 'wishlist-owner@example.com' });
    const token = await loginUser(user);
    const activity = await createActivity();

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await request(app)
        .post(`/api/wishlist/${activity._id}`)
        .set(authHeader(token))
        .expect(200);
      expect(response.body.wishlist.activities).toHaveLength(1);
    }

    const removed = await request(app)
      .delete(`/api/wishlist/${activity._id}`)
      .set(authHeader(token))
      .expect(200);
    expect(removed.body.wishlist.activities).toEqual([]);
  });

  it('keeps wishlist contents scoped to their owner', async () => {
    const owner = await createUser({ email: 'wishlist-scope-owner@example.com' });
    const other = await createUser({ email: 'wishlist-scope-other@example.com' });
    const ownerToken = await loginUser(owner);
    const otherToken = await loginUser(other);
    const activity = await createActivity();

    await request(app)
      .post(`/api/wishlist/${activity._id}`)
      .set(authHeader(ownerToken))
      .expect(200);
    const otherList = await request(app)
      .get('/api/wishlist')
      .set(authHeader(otherToken))
      .expect(200);
    const ownerList = await request(app)
      .get('/api/wishlist')
      .set(authHeader(ownerToken))
      .expect(200);

    expect(otherList.body.wishlist.activities).toEqual([]);
    expect(ownerList.body.wishlist.activities[0]._id).toBe(activity._id.toString());
  });

  it('rejects malformed identifiers and inactive activities', async () => {
    const user = await createUser({ email: 'wishlist-validation@example.com' });
    const token = await loginUser(user);
    const inactive = await createActivity({ overrides: { status: 'inactive' } });

    await request(app)
      .post('/api/wishlist/not-an-id')
      .set(authHeader(token))
      .expect(422);
    const response = await request(app)
      .post(`/api/wishlist/${inactive._id}`)
      .set(authHeader(token))
      .expect(404);

    expect(response.body.message).toBe('Activity not found.');
  });

  it('requires authentication for every wishlist operation', async () => {
    const activity = await createActivity();

    await request(app).get('/api/wishlist').expect(401);
    await request(app).post(`/api/wishlist/${activity._id}`).expect(401);
    await request(app).delete(`/api/wishlist/${activity._id}`).expect(401);
  });
});
