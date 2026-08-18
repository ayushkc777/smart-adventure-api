import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const defaultJwtSecret = 'development_only_replace_this_secret';
const environmentNames = new Set(['development', 'test', 'production']);
const jwtDurationPattern = /^\d+[smhdw]$/i;

const valueOrDefault = (source, key, fallback) =>
  source[key] === undefined ? fallback : String(source[key]).trim();

const assertHttpOrigins = (value) => {
  const origins = value.split(',').map((origin) => origin.trim());
  if (!origins.length || origins.some((origin) => !origin)) return false;

  return origins.every((origin) => {
    try {
      return ['http:', 'https:'].includes(new URL(origin).protocol);
    } catch {
      return false;
    }
  });
};

export const loadEnv = (source = process.env) => {
  const nodeEnv = valueOrDefault(source, 'NODE_ENV', 'development');
  const port = Number(valueOrDefault(source, 'PORT', '5000'));
  const jwtSecret = valueOrDefault(source, 'JWT_SECRET', defaultJwtSecret);
  const jwtExpiresIn = valueOrDefault(source, 'JWT_EXPIRES_IN', '7d');
  const jwtCookieExpiresIn = Number(valueOrDefault(source, 'JWT_COOKIE_EXPIRES_IN', '7'));
  const clientOrigin = valueOrDefault(source, 'CLIENT_ORIGIN', 'http://localhost:5173');
  const uploadDir = valueOrDefault(source, 'UPLOAD_DIR', 'src/uploads');
  const mongoUri = valueOrDefault(source, 'MONGO_URI', 'mongodb://127.0.0.1:27017/smart_adventure_booking');

  if (!environmentNames.has(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production.');
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  if (!jwtDurationPattern.test(jwtExpiresIn)) {
    throw new Error('JWT_EXPIRES_IN must be a positive duration such as 1h or 7d.');
  }
  if (!Number.isInteger(jwtCookieExpiresIn) || jwtCookieExpiresIn < 1) {
    throw new Error('JWT_COOKIE_EXPIRES_IN must be a positive whole number of days.');
  }
  if (!assertHttpOrigins(clientOrigin)) {
    throw new Error('CLIENT_ORIGIN must contain one or more valid HTTP(S) origins.');
  }
  if (!/^mongodb(?:\+srv)?:\/\//.test(mongoUri)) {
    throw new Error('MONGO_URI must be a valid MongoDB connection URI.');
  }
  if (!uploadDir || path.isAbsolute(uploadDir) || uploadDir.split(/[\\/]/).includes('..')) {
    throw new Error('UPLOAD_DIR must be a non-empty relative path without parent traversal.');
  }
  if (nodeEnv === 'production' && (jwtSecret === defaultJwtSecret || jwtSecret.length < 32)) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters in production.');
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    MONGO_URI: mongoUri,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: jwtExpiresIn,
    JWT_COOKIE_EXPIRES_IN: jwtCookieExpiresIn,
    CLIENT_ORIGIN: clientOrigin,
    UPLOAD_DIR: uploadDir,
  };
};

export const env = loadEnv();
