import path from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { apiRouter } from './routes/index.js';
import { ApiError } from './utils/apiError.js';

const app = express();

const allowedOrigins = env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim());

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new ApiError(403, 'CORS origin is not allowed.'));
    },
    credentials: true,
  }),
);

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(process.cwd(), env.UPLOAD_DIR)));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Smart Adventure API.',
    health: '/api/health',
  });
});

app.use('/api', apiRouter);
app.use(notFound);
app.use(errorHandler);

export default app;
