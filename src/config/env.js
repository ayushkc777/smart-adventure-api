import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const defaultJwtSecret = 'development_only_replace_this_secret';

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_adventure_booking',
  JWT_SECRET: process.env.JWT_SECRET || defaultJwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_COOKIE_EXPIRES_IN: Number(process.env.JWT_COOKIE_EXPIRES_IN || 7),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'src/uploads',
};

if (env.NODE_ENV === 'production' && env.JWT_SECRET === defaultJwtSecret) {
  throw new Error('JWT_SECRET must be configured in production.');
}
