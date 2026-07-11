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
