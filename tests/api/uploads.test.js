import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import {
  authHeader,
  createActivity,
  createOperator,
  createUser,
  loginUser,
} from '../helpers/factories.js';

const pngImage = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

async function createAdminSession(email) {
  const admin = await createUser({ email, role: 'admin' });
  return loginUser(admin);
}

describe('image upload api', () => {
  it('adds valid PNG files to an activity gallery', async () => {
    const token = await createAdminSession('gallery-success@example.com');
    const activity = await createActivity();

    const response = await request(app)
      .post(`/api/activities/${activity._id}/gallery`)
      .set(authHeader(token))
      .attach('gallery', pngImage, { contentType: 'image/png', filename: 'activity.png' })
      .expect(200);

    expect(response.body.activity.gallery).toHaveLength(2);
    expect(response.body.activity.gallery[1]).toMatchObject({
      alt: activity.title,
      url: expect.stringMatching(/^\/uploads\/activities\/.+\.png$/),
    });
  });

  it('requires at least one gallery file', async () => {
    const token = await createAdminSession('gallery-empty@example.com');
    const activity = await createActivity();

    const response = await request(app)
      .post(`/api/activities/${activity._id}/gallery`)
      .set(authHeader(token))
      .expect(400);

    expect(response.body.message).toBe('At least one gallery image is required.');
  });

  it('rejects gallery file count and content violations', async () => {
    const token = await createAdminSession('gallery-limits@example.com');
    const activity = await createActivity();
    let excessiveRequest = request(app)
      .post(`/api/activities/${activity._id}/gallery`)
      .set(authHeader(token));
    for (let index = 0; index < 9; index += 1) {
      excessiveRequest = excessiveRequest.attach('gallery', pngImage, {
        contentType: 'image/png',
        filename: `activity-${index}.png`,
      });
    }

    await excessiveRequest.expect(400);
    const invalid = await request(app)
      .post(`/api/activities/${activity._id}/gallery`)
      .set(authHeader(token))
      .attach('gallery', Buffer.from('not an image'), {
        contentType: 'image/png',
        filename: 'fake.png',
      })
      .expect(400);
    expect(invalid.body.message).toMatch(/file content/i);
  });

  it('returns not found when uploading to a missing activity', async () => {
    const token = await createAdminSession('gallery-missing@example.com');

    const response = await request(app)
      .post('/api/activities/507f1f77bcf86cd799439011/gallery')
      .set(authHeader(token))
      .attach('gallery', pngImage, { contentType: 'image/png', filename: 'activity.png' })
      .expect(404);

    expect(response.body.message).toBe('Activity not found.');
  });

  it('uploads a valid operator logo as admin', async () => {
    const token = await createAdminSession('logo-success@example.com');
    const operator = await createOperator();

    const response = await request(app)
      .post(`/api/operators/${operator._id}/logo`)
      .set(authHeader(token))
      .attach('logo', pngImage, { contentType: 'image/png', filename: 'logo.png' })
      .expect(200);

    expect(response.body.operator.logo).toMatch(/^\/uploads\/operators\/.+\.png$/);
  });

  it('rejects missing and invalid operator logo files', async () => {
    const token = await createAdminSession('logo-validation@example.com');
    const operator = await createOperator();

    const missing = await request(app)
      .post(`/api/operators/${operator._id}/logo`)
      .set(authHeader(token))
      .expect(400);
    expect(missing.body.message).toBe('Logo image is required.');

    const invalid = await request(app)
      .post(`/api/operators/${operator._id}/logo`)
      .set(authHeader(token))
      .attach('logo', Buffer.from('not an image'), {
        contentType: 'image/webp',
        filename: 'logo.webp',
      })
      .expect(400);
    expect(invalid.body.message).toMatch(/file content/i);
  });

  it('checks operator existence and admin authorization for logo uploads', async () => {
    const adminToken = await createAdminSession('logo-missing@example.com');
    const user = await createUser({ email: 'logo-user@example.com' });
    const userToken = await loginUser(user);
    const operator = await createOperator();

    await request(app)
      .post(`/api/operators/${operator._id}/logo`)
      .set(authHeader(userToken))
      .attach('logo', pngImage, { contentType: 'image/png', filename: 'logo.png' })
      .expect(403);
    const missing = await request(app)
      .post('/api/operators/507f1f77bcf86cd799439011/logo')
      .set(authHeader(adminToken))
      .attach('logo', pngImage, { contentType: 'image/png', filename: 'logo.png' })
      .expect(404);

    expect(missing.body.message).toBe('Operator not found.');
  });
});
