const config = require('../config/env');
const AppError = require('../utils/appError');
const { errorResponse } = require('../utils/response');

/**
 * Handle 404 Route Not Found
 */
const notFoundHandler = (req, res, next) => {
  next(new AppError(`Cannot find endpoint ${req.method} ${req.originalUrl} on this server`, 404));
};

/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || [];

  // 1. MySQL Specific Error Handling
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    if (err.sqlMessage && err.sqlMessage.includes('uq_ratings_user_store')) {
      message = 'You have already submitted a rating for this store. Please modify your existing rating instead.';
    } else if (err.sqlMessage && err.sqlMessage.includes('email')) {
      message = 'An account with this email address already exists.';
    } else if (err.sqlMessage && err.sqlMessage.includes('uq_stores_owner')) {
      message = 'This store owner is already assigned to another store.';
    } else {
      message = 'Duplicate entry detected. The resource already exists.';
    }
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Referenced resource (user or store) does not exist.';
  } else if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    statusCode = 400;
    message = 'Data check constraint violated. Please check name, address, or rating range constraints.';
  } else if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    statusCode = 503;
    message = 'Database service currently unavailable. Please verify MySQL connection.';
  }

  // 2. JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
  }

  // 3. JSON Syntax Parsing Error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON in request body.';
  }

  // 4. Sanitize 500 internal errors in production to avoid leaking driver/query/schema details
  if (statusCode === 500) {
    if (config.nodeEnv === 'development') {
      console.error('[Internal Error 500]:', err);
    } else {
      message = 'An unexpected internal server error occurred. Please try again later.';
      errors = [];
    }
  }

  return errorResponse(res, {
    statusCode,
    message,
    errors
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};
