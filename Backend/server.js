const dotenv = require('dotenv');
const logger = require('./utils/logger');
const { isRedisAvailable } = require('./config/redis');

// Config
dotenv.config({ path: '.env' });

const app = require('./app');
const connectDB = require('./config/db');

// Connect to database
connectDB();

// Initialize Queue Workers (Only if Redis is available)
isRedisAvailable().then((available) => {
  if (available) {
    require('./workers');
    logger.info('[SERVER] Background workers started.');
  } else {
    logger.warn('[SERVER] Redis unavailable. Background workers disabled.');
  }
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server started on PORT: ${PORT} in ${process.env.NODE_ENV} mode.`);
});

// Handle Unhandled Promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`UNHANDLED REJECTION! 💥 Shutting down...`);
  logger.error(err.message, { stack: err.stack });
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
const shutdown = () => {
  logger.info('SIGTERM/SIGINT received. Shutting down gracefully...');
  server.close(async () => {
    logger.info('HTTP server closed.');
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close(false);
      logger.info('MongoDB connection closed.');
    }
    process.exit(0);
  });
  
  // Force close after 10s
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);