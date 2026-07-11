import { Booking } from '../models/Booking.js';
import { Notification } from '../models/Notification.js';
import { Review } from '../models/Review.js';
import { User } from '../models/User.js';
import { Wishlist } from '../models/Wishlist.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPublicFilePath } from '../middleware/upload.js';
import { getPagination, sendPaginated } from '../utils/pagination.js';

const buildUserFilter = (query) => {
  const filter = {};

  if (query.role) {
    filter.role = query.role;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.search) {
    filter.$or = [
      { fullName: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ];
  }

  return filter;
};

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit } = getPagination(req.query);
  const query = User.find(buildUserFilter(req.query)).sort({ createdAt: -1 });

  await sendPaginated({ res, query, page, limit, dataKey: 'users' });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const bookingCount = await Booking.countDocuments({ user: user._id });

  res.json({
    success: true,
    user,
    bookingCount,
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  if (req.user._id.toString() === user._id.toString()) {
    if (req.body.role !== undefined && req.body.role !== user.role) {
      throw new ApiError(400, 'You cannot change your own admin role.');
    }

    if (req.body.status !== undefined && req.body.status !== user.status) {
      throw new ApiError(400, 'You cannot suspend your own admin account.');
    }
  }

  if (user.role === 'admin') {
    const activeAdminCount = await User.countDocuments({ role: 'admin', status: 'active' });
    const wouldRemoveAdminAccess =
      (req.body.role && req.body.role !== 'admin') ||
      (req.body.status && req.body.status !== 'active');

    if (activeAdminCount <= 1 && wouldRemoveAdminAccess) {
      throw new ApiError(400, 'At least one active admin account is required.');
    }
  }

  const allowedFields = [
    'fullName',
    'phone',
    'nationality',
    'preferredLanguage',
    'emergencyContact',
    'role',
    'status',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  await user.save();

  res.json({
    success: true,
    message: 'User updated successfully.',
    user,
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (req.user._id.toString() === req.params.id) {
    throw new ApiError(400, 'You cannot delete the currently logged-in admin account.');
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  if (user.role === 'admin') {
    const activeAdminCount = await User.countDocuments({ role: 'admin', status: 'active' });

    if (activeAdminCount <= 1 && user.status === 'active') {
      throw new ApiError(400, 'At least one active admin account is required.');
    }
  }

  const [bookingCount, reviewCount, wishlistCount, notificationCount] = await Promise.all([
    Booking.countDocuments({ user: user._id }),
    Review.countDocuments({ user: user._id }),
    Wishlist.countDocuments({ user: user._id }),
    Notification.countDocuments({ user: user._id }),
  ]);

  if (bookingCount > 0 || reviewCount > 0 || wishlistCount > 0 || notificationCount > 0) {
    user.status = 'suspended';
    await user.save();

    return res.json({
      success: true,
      message: 'User has related records and was suspended instead of deleted.',
      user,
    });
  }

  await user.deleteOne();

  return res.json({
    success: true,
    message: 'User deleted successfully.',
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['fullName', 'phone', 'nationality', 'preferredLanguage', 'emergencyContact'];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      req.user[field] = req.body[field];
    }
  });

  await req.user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully.',
    user: req.user,
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect.');
  }

  user.password = req.body.newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully.',
  });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Avatar image is required.');
  }

  req.user.avatar = getPublicFilePath(req.file, 'avatars');
  await req.user.save();

  res.json({
    success: true,
    message: 'Avatar uploaded successfully.',
    user: req.user,
  });
});

export const deleteAvatar = asyncHandler(async (req, res) => {
  req.user.avatar = '';
  await req.user.save();

  res.json({
    success: true,
    message: 'Avatar removed successfully.',
    user: req.user,
  });
});
