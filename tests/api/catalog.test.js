import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { Activity } from '../../src/models/Activity.js';
import {
  authHeader,
  createActivity,
  createBooking,
  createOperator,
  createUser,
  loginUser,
} from '../helpers/factories.js';

describe('activities and operators api', () => {
  it('shows only active operators publicly and lets admins filter inactive operators', async () => {
    await createOperator({ companyName: 'Active Operator', licenseNumber: 'ACTIVE-1' });
    await createOperator({
      companyName: 'Inactive Operator',
      licenseNumber: 'INACTIVE-1',
      status: 'inactive',
    });
    const admin = await createUser({ email: 'admin-operators@example.com', role: 'admin' });
    const adminToken = await loginUser(admin);

    const publicResponse = await request(app).get('/api/operators').expect(200);
    expect(publicResponse.body.operators.map((operator) => operator.companyName)).toEqual([
      'Active Operator',
    ]);

    const adminResponse = await request(app)
      .get('/api/operators?status=inactive')
      .set(authHeader(adminToken))
      .expect(200);

    expect(adminResponse.body.operators[0].companyName).toBe('Inactive Operator');
  });

  it('hides inactive activities publicly while allowing admin inspection', async () => {
    const active = await createActivity({ overrides: { title: 'Visible Adventure' } });
    const inactive = await createActivity({
      overrides: { status: 'inactive', title: 'Hidden Adventure' },
    });
    const admin = await createUser({ email: 'admin-visibility@example.com', role: 'admin' });
    const adminToken = await loginUser(admin);

    const publicList = await request(app).get('/api/activities').expect(200);
    expect(publicList.body.activities.map((activity) => activity.title)).toEqual([
      active.title,
    ]);
    await request(app).get(`/api/activities/${inactive._id}`).expect(404);

    const adminList = await request(app)
      .get('/api/activities?status=inactive')
      .set(authHeader(adminToken))
      .expect(200);
    const adminDetail = await request(app)
      .get(`/api/activities/${inactive._id}`)
      .set(authHeader(adminToken))
      .expect(200);

    expect(adminList.body.activities).toHaveLength(1);
    expect(adminList.body.activities[0].title).toBe('Hidden Adventure');
    expect(adminDetail.body.activity.status).toBe('inactive');
  });

  it('creates and updates activities as admin while recalculating slug and priceFrom', async () => {
    const admin = await createUser({ email: 'admin-activities@example.com', role: 'admin' });
    const adminToken = await loginUser(admin);
    const operator = await createOperator();

    const createResponse = await request(app)
      .post('/api/activities')
      .set(authHeader(adminToken))
      .send({
        bestSeason: ['October'],
        description: 'A detailed test activity description for admin catalog management.',
        difficulty: 'Easy',
        district: 'Kaski',
        duration: '30 minutes',
        operatorPrices: [{ operator: operator._id.toString(), price: 8500 }],
        province: 'Gandaki',
        riskLevel: 'Medium',
        title: 'Original Activity Title',
      })
      .expect(201);

    expect(createResponse.body.activity.priceFrom).toBe(8500);
    expect(createResponse.body.activity.slug).toBe('original-activity-title');

    const updateResponse = await request(app)
      .patch(`/api/activities/${createResponse.body.activity._id}`)
      .set(authHeader(adminToken))
      .send({ priceFrom: 1, title: 'Updated Activity Title' })
      .expect(200);

    expect(updateResponse.body.activity.priceFrom).toBe(8500);
    expect(updateResponse.body.activity.slug).toBe('updated-activity-title');
  });

  it('validates nested operator price fields and duplicate operators', async () => {
    const admin = await createUser({ email: 'admin-price-validation@example.com', role: 'admin' });
    const adminToken = await loginUser(admin);
    const operator = await createOperator();
    const basePayload = {
      description: 'A detailed activity description used to validate nested operator prices.',
      difficulty: 'Easy',
      district: 'Kaski',
      duration: 'One hour',
      province: 'Gandaki',
      riskLevel: 'Low',
      title: 'Nested Price Validation',
    };

    const duplicateResponse = await request(app)
      .post('/api/activities')
      .set(authHeader(adminToken))
      .send({
        ...basePayload,
        operatorPrices: [
          { operator: operator._id.toString(), price: 8000 },
          { operator: operator._id.toString(), price: 9000 },
        ],
      })
      .expect(422);
    const malformedResponse = await request(app)
      .post('/api/activities')
      .set(authHeader(adminToken))
      .send({
        ...basePayload,
        operatorPrices: [{
          currency: 'USD',
          includedServices: ['Helmet', ' helmet '],
          operator: operator._id.toString(),
          packageName: '',
          price: 8000,
        }],
      })
      .expect(422);

    expect(duplicateResponse.body.errors).toContainEqual({
      field: 'operatorPrices',
      message: 'Operator prices must not contain duplicate operators.',
    });
    expect(malformedResponse.body.errors).toEqual(expect.arrayContaining([
      { field: 'operatorPrices[0].currency', message: 'Operator price currency must be NPR.' },
      { field: 'operatorPrices[0].includedServices', message: 'Included services must not contain duplicates.' },
      { field: 'operatorPrices[0].packageName', message: 'Package name must be between 1 and 100 characters.' },
    ]));
  });

  it('requires activity pricing to reference existing active operators', async () => {
    const admin = await createUser({ email: 'admin-operator-reference@example.com', role: 'admin' });
    const adminToken = await loginUser(admin);
    const inactiveOperator = await createOperator({
      companyName: 'Inactive Price Operator',
      licenseNumber: 'INACTIVE-PRICE-1',
      status: 'inactive',
    });
    const missingOperatorId = '507f1f77bcf86cd799439099';
    const basePayload = {
      description: 'A detailed activity description used to validate operator references.',
      difficulty: 'Easy',
      district: 'Kaski',
      duration: 'One hour',
      province: 'Gandaki',
      riskLevel: 'Low',
      title: 'Operator Reference Validation',
    };

    const missing = await request(app)
      .post('/api/activities')
      .set(authHeader(adminToken))
      .send({ ...basePayload, operatorPrices: [{ operator: missingOperatorId, price: 8000 }] })
      .expect(400);
    const inactive = await request(app)
      .post('/api/activities')
      .set(authHeader(adminToken))
      .send({
        ...basePayload,
        operatorPrices: [{ operator: inactiveOperator._id.toString(), price: 8000 }],
      })
      .expect(400);

    expect(missing.body.message).toBe('Every activity operator must exist.');
    expect(inactive.body.message).toBe('Activity prices may only reference active operators.');
    expect(await Activity.countDocuments({ title: basePayload.title })).toBe(0);
  });

  it('archives activities with related records instead of leaving orphaned bookings', async () => {
    const admin = await createUser({ email: 'admin-delete-activity@example.com', role: 'admin' });
    const adminToken = await loginUser(admin);
    const operator = await createOperator();
    const activity = await createActivity({ operator });
    await createBooking({ activity, operator });

    const response = await request(app)
      .delete(`/api/activities/${activity._id}`)
      .set(authHeader(adminToken))
      .expect(200);

    expect(response.body.message).toMatch(/archived/i);
    const archived = await Activity.findById(activity._id);
    expect(archived.status).toBe('archived');
  });
});
