import { describe, expect, it } from 'vitest';
import { loadEnv } from '../../src/config/env.js';

const validProductionEnv = {
  CLIENT_ORIGIN: 'https://smart-adventure.example,https://admin.smart-adventure.example',
  JWT_COOKIE_EXPIRES_IN: '7',
  JWT_EXPIRES_IN: '2h',
  JWT_SECRET: 'a-production-secret-that-is-longer-than-32-characters',
  NODE_ENV: 'production',
  PORT: '5050',
  UPLOAD_DIR: 'var/uploads',
};

describe('environment configuration', () => {
  it('loads valid development defaults and production settings', () => {
    expect(loadEnv({})).toMatchObject({
      CLIENT_ORIGIN: 'http://localhost:5173',
      JWT_COOKIE_EXPIRES_IN: 7,
      NODE_ENV: 'development',
      PORT: 5000,
      UPLOAD_DIR: 'src/uploads',
    });
    expect(loadEnv(validProductionEnv)).toMatchObject({
      NODE_ENV: 'production',
      PORT: 5050,
      JWT_EXPIRES_IN: '2h',
    });
  });

  it.each([
    [{ ...validProductionEnv, PORT: '0' }, /PORT must be an integer/i],
    [{ ...validProductionEnv, JWT_COOKIE_EXPIRES_IN: '1.5' }, /positive whole number/i],
    [{ ...validProductionEnv, JWT_EXPIRES_IN: 'later' }, /positive duration/i],
    [{ ...validProductionEnv, CLIENT_ORIGIN: '' }, /valid HTTP\(S\) origins/i],
    [{ ...validProductionEnv, MONGO_URI: 'postgres://localhost/app' }, /MongoDB connection URI/i],
    [{ ...validProductionEnv, UPLOAD_DIR: '../uploads' }, /relative path/i],
    [{ ...validProductionEnv, JWT_SECRET: 'short' }, /at least 32 characters/i],
  ])('rejects invalid production configuration %#', (source, message) => {
    expect(() => loadEnv(source)).toThrow(message);
  });
});
