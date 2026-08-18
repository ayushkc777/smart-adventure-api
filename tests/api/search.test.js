import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { authHeader, createActivity, createOperator, createUser, loginUser } from '../helpers/factories.js';

describe('literal list searches', () => {
  it('treats regular-expression metacharacters as literal text across resources', async () => {
    const admin = await createUser({ email: 'search-admin@example.com', role: 'admin' });
    const adminToken = await loginUser(admin);
    await createActivity({ overrides: { title: 'Searchable Adventure' } });
    await createOperator({ companyName: 'Searchable Operator', licenseNumber: 'SEARCH-1' });
    await createUser({ email: 'search-user@example.com', fullName: 'Searchable User' });

    const [activitiesResponse, operatorsResponse, usersResponse] = await Promise.all([
      request(app).get('/api/activities?search=.*').expect(200),
      request(app).get('/api/operators?search=.*').expect(200),
      request(app).get('/api/users?search=.*').set(authHeader(adminToken)).expect(200),
    ]);

    expect(activitiesResponse.body.activities).toHaveLength(0);
    expect(operatorsResponse.body.operators).toHaveLength(0);
    expect(usersResponse.body.users).toHaveLength(0);
  });

  it('still supports case-insensitive ordinary text searches', async () => {
    await createActivity({ overrides: { title: 'Literal Search Adventure' } });

    const response = await request(app).get('/api/activities?search=literal%20search').expect(200);

    expect(response.body.activities).toHaveLength(1);
    expect(response.body.activities[0].title).toBe('Literal Search Adventure');
  });
});
