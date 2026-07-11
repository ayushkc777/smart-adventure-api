import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getTokenFromRequest = (req) => {
  const header = req.headers.authorization;

  if (header?.startsWith('Bearer ')) {
    return header.split(' ')[1];
  }

  return req.cookies?.token;
};

export const protect = asyncHandler(async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    throw new ApiError(401, 'Authentication is required.');
  }

  const decoded = jwt.verify(token, env.JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) {
    throw new ApiError(401, 'Authenticated user no longer exists.');
  }

  if (user.status !== 'active') {
    throw new ApiError(403, 'Account is not active.');
  }

  req.user = user;
  next();
});

export const optionalProtect = asyncHandler(async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return next();
  }

  const decoded = jwt.verify(token, env.JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user || user.status !== 'active') {
    throw new ApiError(401, 'Authentication token is invalid or expired.');
  }

  req.user = user;
  return next();
});

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to access this resource.'));
  }

  return next();
};
