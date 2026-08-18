import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, sendPaginated } from '../utils/pagination.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' && req.query.user ? { user: req.query.user } : { user: req.user._id };
  const { page, limit } = getPagination(req.query);
  const query = Notification.find(filter).sort({ createdAt: -1 });

  await sendPaginated({ res, query, page, limit, dataKey: 'notifications' });
});

export const createNotification = asyncHandler(async (req, res) => {
  const recipient = await User.findById(req.body.user).select('status');
  if (!recipient) {
    throw new ApiError(404, 'Notification recipient not found.');
  }
  if (recipient.status !== 'active') {
    throw new ApiError(400, 'Notifications may only be sent to active users.');
  }

  const notification = await Notification.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Notification created successfully.',
    notification,
  });
});

export const updateNotificationReadStatus = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new ApiError(404, 'Notification not found.');
  }

  if (req.user.role !== 'admin' && notification.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You cannot update this notification.');
  }

  notification.read = req.body.read;
  await notification.save();

  res.json({
    success: true,
    message: 'Notification updated successfully.',
    notification,
  });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new ApiError(404, 'Notification not found.');
  }

  if (req.user.role !== 'admin' && notification.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You cannot delete this notification.');
  }

  await notification.deleteOne();

  res.json({
    success: true,
    message: 'Notification deleted successfully.',
  });
});
