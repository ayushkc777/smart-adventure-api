import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { getPagination } from '../../src/utils/pagination.js';
import { createOperator } from '../helpers/factories.js';

describe('pagination boundaries', () => {
  it('normalizes missing and non-numeric helper inputs', () => {
    expect(getPagination({})).toEqual({ page: 1, limit: 10, skip: 0 });
    expect(getPagination({ page: '-4', limit: 'invalid' })).toEqual({
      page: 1,
      limit: 10,
      skip: 0,
    });
  });

  it('caps helper limits and calculates offsets', () => {
    expect(getPagination({ page: '3', limit: '500' })).toEqual({
      page: 3,
      limit: 100,
      skip: 200,
    });
    expect(getPagination({ page: '2', limit: '1' })).toEqual({ page: 2, limit: 1, skip: 1 });
  });

  it('rejects invalid public list pagination values', async () => {
    const belowMinimum = await request(app).get('/api/operators?page=0&limit=0').expect(422);
    const aboveMaximum = await request(app).get('/api/operators?limit=101').expect(422);

    expect(belowMinimum.body.errors.map((error) => error.field)).toEqual(
      expect.arrayContaining(['page', 'limit']),
    );
    expect(aboveMaximum.body.errors).toContainEqual(
      expect.objectContaining({ field: 'limit' }),
    );
  });

  it('returns stable metadata for empty and out-of-range pages', async () => {
    const empty = await request(app).get('/api/operators?page=1&limit=5').expect(200);
    expect(empty.body).toMatchObject({
      operators: [],
      pagination: { page: 1, limit: 5, total: 0, pages: 1 },
    });

    await createOperator();
    const outOfRange = await request(app).get('/api/operators?page=3&limit=1').expect(200);
    expect(outOfRange.body).toMatchObject({
      operators: [],
      pagination: { page: 3, limit: 1, total: 1, pages: 1 },
    });
  });
});
