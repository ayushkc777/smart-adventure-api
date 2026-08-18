const closeServer = (server) => new Promise((resolve, reject) => {
  server.close((error) => (error ? reject(error) : resolve()));
});

export const createShutdownHandler = ({ disconnect, exit, logger, server }) => {
  let shutdownPromise;

  return () => {
    if (shutdownPromise) return shutdownPromise;

    shutdownPromise = (async () => {
      logger.info('Shutting down API server...');
      try {
        await closeServer(server);
        await disconnect();
        exit(0);
      } catch (error) {
        logger.error(`Graceful shutdown failed: ${error.message}`);
        exit(1);
      }
    })();

    return shutdownPromise;
  };
};
