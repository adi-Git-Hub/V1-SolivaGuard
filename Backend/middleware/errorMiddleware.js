const ErrorHandler = require('../utils/errorHandler');
const logger = require('../utils/logger');

const notFound = (req, res, next) => {
  const error = new ErrorHandler(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Log Error details via Winston
  logger.error(`${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip} - User: ${req.user ? req.user.id : 'Guest'}`, { stack: err.stack });

  // Handle Multer errors specifically
  if (err.name === 'MulterError') {
    const message = `File Upload Error: ${err.message}`;
    err = new ErrorHandler(message, 400);
  }

  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    const labels = { email: 'email', phoneNumber: 'phone number', username: 'username' };
    const message = `This ${labels[field] || field} is already registered`;
    err = new ErrorHandler(message, 400);
  }

  if (err.name === 'JsonWebTokenError') {
    const message = `Json Web Token is invalid, try again`;
    err = new ErrorHandler(message, 400);
  }

  if (err.name === 'TokenExpiredError') {
    const message = `Json Web Token is expired, try again`;
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    // Only surface our string error codes (e.g. ACCOUNT_BLOCKED). Mongo's
    // numeric codes are internal and must not leak to clients.
    ...(typeof err.code === 'string' ? { code: err.code } : {}),
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };