import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createPublicSubmissionLimiter } from '../../src/middleware/rateLimit.js';

function createLimitedApp(message) {
  const app = express();
  app.post(
    '/submit',
    createPublicSubmissionLimiter({ limit: 2, message, windowMs: 60_000 }),
    (req, res) => res.status(204).end(),
  );
  return app;
}

describe('public submission rate limits', () => {
  it('allows support traffic up to the isolated limit and then returns 429', async () => {
    const app = createLimitedApp('Too many support requests. Please try again later.');

    await request(app).post('/submit').expect(204);
    await request(app).post('/submit').expect(204);
    const limited = await request(app).post('/submit').expect(429);

    expect(limited.body).toEqual({
      success: false,
      message: 'Too many support requests. Please try again later.',
    });
    expect(limited.headers['ratelimit-policy']).toBeDefined();
  });

  it('limits newsletter traffic without leaking state into a new limiter', async () => {
    const message = 'Too many newsletter requests. Please try again later.';
    const firstApp = createLimitedApp(message);

    await request(firstApp).post('/submit').expect(204);
    await request(firstApp).post('/submit').expect(204);
    const limited = await request(firstApp).post('/submit').expect(429);
    expect(limited.body.message).toBe(message);

    const isolatedApp = createLimitedApp(message);
    await request(isolatedApp).post('/submit').expect(204);
  });
});
