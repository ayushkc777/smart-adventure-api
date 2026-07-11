import { ApiError } from '../utils/apiError.js';

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || [];

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource identifier.';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed.';
    errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }));
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} already exists.`;
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token is invalid or expired.';
  }

  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.message || 'File upload failed.';
  }

  if (!(err instanceof ApiError) && statusCode === 500) {
    console.error(err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
