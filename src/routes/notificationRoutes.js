import express from 'express';
import {
  createNotification,
  deleteNotification,
  listNotifications,
  updateNotificationReadStatus,
} from '../controllers/notificationController.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { mongoIdParam } from '../validators/commonValidators.js';
import {
  createNotificationValidator,
  listNotificationsValidator,
  markNotificationValidator,
} from '../validators/notificationValidators.js';

export const notificationRouter = express.Router();

notificationRouter.use(protect);

notificationRouter.get('/', listNotificationsValidator, validate, listNotifications);
notificationRouter.post('/', authorize('admin'), createNotificationValidator, validate, createNotification);
notificationRouter.patch('/:id', mongoIdParam(), markNotificationValidator, validate, updateNotificationReadStatus);
notificationRouter.delete('/:id', mongoIdParam(), validate, deleteNotification);
