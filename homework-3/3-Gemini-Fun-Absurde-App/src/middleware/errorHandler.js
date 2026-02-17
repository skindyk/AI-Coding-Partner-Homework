'use strict';

/**
 * Centralised error handler middleware
 * Formats all errors as { success: false, error: { code, message } }
 */
function errorHandler(err, req, res, next) {
  // Default error properties
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    code = 'NOT_FOUND';
  } else if (err.name === 'ConflictError') {
    statusCode = 409;
    code = 'CONFLICT';
  }

  // Log the error (but don't expose stack trace to client)
  console.error(`[${code}] ${message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message
    }
  });
}

module.exports = errorHandler;
