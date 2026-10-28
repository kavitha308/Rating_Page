console.log('Booting Store Rating Platform API...');
const app = require('./app');
const config = require('./config/env');
const db = require('./config/db');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

const server = app.listen(config.port, async () => {
  console.log(`====================================================`);
  console.log(` Store Rating Platform API is running on port ${config.port}`);
  console.log(` Environment : ${config.nodeEnv}`);
  console.log(` API Base    : http://localhost:${config.port}/api`);
  console.log(` Health Check: http://localhost:${config.port}/api/health`);
  console.log(`====================================================`);

  // Verify database connection
  const dbHealth = await db.testConnection();
  if (dbHealth.connected) {
    console.log(` [Database] Database connected successfully.`);
  } else {
    console.warn(` [Database Warning] Could not connect to database: ${dbHealth.error}`);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down gracefully...', err);
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown on termination signals
const handleShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Closing HTTP server and database pool...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await db.pool.end();
      console.log('MySQL connection pool drained.');
    } catch (e) {
      console.error('Error closing MySQL pool:', e.message);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
