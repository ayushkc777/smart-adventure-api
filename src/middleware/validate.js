import { validationResult } from 'express-validator';
import { ApiError } from '../utils/apiError.js';

export const validate = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array().map((error) => ({
    field: error.path,
    message: error.msg,
  }));

  return next(new ApiError(422, 'Validation failed.', errors));
};
