import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { clearAuthCookie, setAuthCookie, signToken } from '../utils/jwt.js';

const sendAuthResponse = (res, user, statusCode = 200) => {
  const token = signToken(user);
  setAuthCookie(res, token);

  return res.status(statusCode).json({
    success: true,
    token,
    user,
  });
};

export const register = asyncHandler(async (req, res) => {
  const existingUser = await User.findOne({ email: req.body.email });

  if (existingUser) {
    throw new ApiError(409, 'Email is already registered.');
  }

  const user = await User.create({
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone,
    nationality: req.body.nationality,
    preferredLanguage: req.body.preferredLanguage,
    emergencyContact: req.body.emergencyContact,
  });

  return sendAuthResponse(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');

  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (user.status !== 'active') {
    throw new ApiError(403, 'Account is not active.');
  }

  return sendAuthResponse(res, user);
});

export const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);

  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});
