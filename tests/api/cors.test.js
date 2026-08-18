import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { isOriginAllowed, parseAllowedOrigins } from '../../src/utils/cors.js';

describe('cors origin policy', () => {
  it('parses comma-separated origins without blank entries', () => {
    expect(
      parseAllowedOrigins(' https://app.example.com,https://admin.example.com,  '),
    ).toEqual(['https://app.example.com', 'https://admin.example.com']);
    expect(isOriginAllowed('https://admin.example.com', [
      'https://app.example.com',
      'https://admin.example.com',
    ])).toBe(true);
    expect(isOriginAllowed('https://other.example.com', ['https://app.example.com'])).toBe(false);
  });

  it('allows configured origins and returns credential headers', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('blocks unconfigured origins', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'https://untrusted.example.com')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      message: 'CORS origin is not allowed.',
    });
  });

  it('allows server-to-server requests without an Origin header', async () => {
    const response = await request(app).get('/api/health').expect(200);

    expect(response.body.success).toBe(true);
    expect(isOriginAllowed(undefined, [])).toBe(true);
  });
});
