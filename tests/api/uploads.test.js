import fs from 'node:fs/promises';
import path from 'node:path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { Activity } from '../../src/models/Activity.js';
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
const jpegImage = Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9', 'hex');
const webpImage = Buffer.from('5249464610000000574542505650382000000000', 'hex');

async function createAdminSession(email) {
  const admin = await createUser({ email, role: 'admin' });
  return loginUser(admin);
}

async function uploadedFiles(folder) {
  try {
    return await fs.readdir(path.join(process.cwd(), env.UPLOAD_DIR, folder));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
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
    const before = await uploadedFiles('activities');

    const response = await request(app)
      .post('/api/activities/507f1f77bcf86cd799439011/gallery')
      .set(authHeader(token))
      .attach('gallery', pngImage, { contentType: 'image/png', filename: 'activity.png' })
      .expect(404);

    expect(response.body.message).toBe('Activity not found.');
    expect(await uploadedFiles('activities')).toEqual(before);
  });

  it('removes uploaded files when activity persistence fails', async () => {
    const token = await createAdminSession('gallery-save-failure@example.com');
    const activity = await createActivity();
    await Activity.collection.updateOne({ _id: activity._id }, { $unset: { title: '' } });
    const before = await uploadedFiles('activities');

    await request(app)
      .post(`/api/activities/${activity._id}/gallery`)
      .set(authHeader(token))
      .attach('gallery', pngImage, { contentType: 'image/png', filename: 'activity.png' })
      .expect(400);

    expect(await uploadedFiles('activities')).toEqual(before);
  });

  it('uploads a valid operator logo as admin', async () => {
    const token = await createAdminSession('logo-success@example.com');
    const logoDirectory = path.join(process.cwd(), env.UPLOAD_DIR, 'operators');
    const previousLogoPath = path.join(logoDirectory, 'previous-logo.png');
    await fs.mkdir(logoDirectory, { recursive: true });
    await fs.writeFile(previousLogoPath, 'old logo');
    const operator = await createOperator({ logo: '/uploads/operators/previous-logo.png' });

    const response = await request(app)
      .post(`/api/operators/${operator._id}/logo`)
      .set(authHeader(token))
      .attach('logo', pngImage, { contentType: 'image/png', filename: 'logo.png' })
      .expect(200);

    expect(response.body.operator.logo).toMatch(/^\/uploads\/operators\/.+\.png$/);
    await expect(fs.access(previousLogoPath)).rejects.toMatchObject({ code: 'ENOENT' });
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

  it.each([
    ['JPEG', jpegImage, 'image/jpeg', 'logo.jpg'],
    ['PNG', pngImage, 'image/png', 'logo.png'],
    ['WebP', webpImage, 'image/webp', 'logo.webp'],
  ])('accepts matching %s signatures, MIME types, and extensions', async (label, image, contentType, filename) => {
    const token = await createAdminSession(`matching-${label.toLowerCase()}@example.com`);
    const operator = await createOperator({
      companyName: `${label} Signature Operator`,
      licenseNumber: `SIGNATURE-${label}`,
    });

    const response = await request(app)
      .post(`/api/operators/${operator._id}/logo`)
      .set(authHeader(token))
      .attach('logo', image, { contentType, filename })
      .expect(200);

    expect(response.body.operator.logo).toMatch(new RegExp(`\\.${filename.split('.').at(-1)}$`));
  });

  it.each([
    ['declared MIME', pngImage, 'image/jpeg', 'logo.jpg'],
    ['extension', jpegImage, 'image/jpeg', 'logo.png'],
    ['content signature', webpImage, 'image/png', 'logo.webp'],
  ])('rejects an image with a mismatched %s and removes it', async (label, image, contentType, filename) => {
    const token = await createAdminSession(`mismatch-${label.replace(' ', '-')}@example.com`);
    const operator = await createOperator({
      companyName: `${label} Mismatch Operator`,
      licenseNumber: `MISMATCH-${label}`,
    });
    const before = await uploadedFiles('operators');

    const response = await request(app)
      .post(`/api/operators/${operator._id}/logo`)
      .set(authHeader(token))
      .attach('logo', image, { contentType, filename })
      .expect(400);

    expect(response.body.message).toMatch(/content, MIME type, and extension must match/i);
    expect(await uploadedFiles('operators')).toEqual(before);
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
