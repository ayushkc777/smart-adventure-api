import { ApiError } from '../utils/apiError.js';

export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};
