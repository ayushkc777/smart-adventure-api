import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' && req.query.user ? { user: req.query.user } : { user: req.user._id };
  const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);

  res.json({
    success: true,
    notifications,
  });
});

export const createNotification = asyncHandler(async (req, res) => {
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
