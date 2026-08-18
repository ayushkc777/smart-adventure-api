import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.js';
import {
  authHeader,
  createOperator,
  createUser,
  loginUser,
  password,
} from '../helpers/factories.js';

describe('validation error response contract', () => {
  it('returns field-level details for request validation failures', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'invalid', fullName: '', password: 'short', phone: '12' })
      .expect(422);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Validation failed.',
    });
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'email', message: expect.any(String) }),
        expect.objectContaining({ field: 'fullName', message: expect.any(String) }),
        expect.objectContaining({ field: 'password', message: expect.any(String) }),
      ]),
    );
  });

  it('returns a stable conflict response for duplicate unique fields', async () => {
    await User.create({
      email: 'duplicate@example.com',
      fullName: 'Existing User',
      password,
      phone: '9800000000',
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'duplicate@example.com',
        fullName: 'Duplicate User',
        password,
        phone: '9800000001',
      })
      .expect(409);

    expect(response.body).toEqual({
      success: false,
      message: 'Email is already registered.',
      errors: [],
    });
  });

  it('rejects malformed resource identifiers with field context', async () => {
    const response = await request(app).get('/api/operators/not-an-id').expect(422);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Validation failed.',
      errors: [
        {
          field: 'id',
          message: 'id must be a valid MongoDB id.',
        },
      ],
    });
  });

  it('returns a stable response for unknown routes and missing resources', async () => {
    const unknownRoute = await request(app).get('/api/not-a-real-route').expect(404);
    const missingOperator = await request(app)
      .get('/api/operators/507f1f77bcf86cd799439011')
      .expect(404);

    expect(unknownRoute.body).toEqual({
      success: false,
      message: 'Route not found: /api/not-a-real-route',
      errors: [],
    });
    expect(missingOperator.body).toMatchObject({
      success: false,
      message: 'Operator not found.',
    });
  });

  it('maps database unique-index conflicts to a field-specific 409', async () => {
    const admin = await createUser({ email: 'duplicate-index-admin@example.com', role: 'admin' });
    const token = await loginUser(admin);
    await createOperator({ licenseNumber: 'DUPLICATE-LICENSE' });

    const response = await request(app)
      .post('/api/operators')
      .set(authHeader(token))
      .send({
        companyName: 'Second Licensed Operator',
        licenseNumber: 'DUPLICATE-LICENSE',
        location: 'Kathmandu',
      })
      .expect(409);

    expect(response.body).toMatchObject({
      success: false,
      message: 'licenseNumber already exists.',
      errors: [],
    });
  });
});
