import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import app from './app.js';

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(env.PORT, () => {
      console.log(`API server running on port ${env.PORT}`);
    });

    const shutdown = () => {
      console.log('Shutting down API server...');
      server.close(() => process.exit(0));
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
