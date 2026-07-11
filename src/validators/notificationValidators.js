import { body, query } from 'express-validator';

export const listNotificationsValidator = [
  query('user').optional({ checkFalsy: true }).isMongoId().withMessage('User id is invalid.'),
];

export const createNotificationValidator = [
  body('user').isMongoId().withMessage('User id is required.'),
  body('title').trim().isLength({ min: 2, max: 140 }).withMessage('Title is required.'),
  body('message').trim().isLength({ min: 2, max: 1000 }).withMessage('Message is required.'),
];

export const markNotificationValidator = [
  body('read').isBoolean().withMessage('Read status must be boolean.'),
];
