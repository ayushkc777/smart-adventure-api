import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;
const uploadDir = 'test-uploads';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_for_api_tests';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.JWT_COOKIE_EXPIRES_IN = '1';
  process.env.CLIENT_ORIGIN = 'http://localhost:5173';
  process.env.UPLOAD_DIR = uploadDir;

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
  await fs.rm(path.join(process.cwd(), uploadDir), { force: true, recursive: true });
});
