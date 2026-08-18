import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import app from './app.js';
import { createShutdownHandler } from './utils/shutdown.js';

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(env.PORT, () => {
      console.log(`API server running on port ${env.PORT}`);
    });

    const shutdown = createShutdownHandler({
      disconnect: disconnectDB,
      exit: process.exit,
      logger: { error: console.error, info: console.log },
      server,
    });

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
