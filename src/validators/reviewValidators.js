import { body, query } from 'express-validator';
import { requireAtLeastOneField } from './commonValidators.js';

export const createReviewValidator = [
  body('activity').isMongoId().withMessage('Activity id is required.'),
  body('operator').isMongoId().withMessage('Operator id is required.'),
  body('rating').isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5.'),
  body('safetyRating').isFloat({ min: 1, max: 5 }).withMessage('Safety rating must be between 1 and 5.'),
  body('comment').trim().isLength({ min: 5, max: 1200 }).withMessage('Comment is required.'),
];

export const listReviewsValidator = [
  query('activity').optional({ checkFalsy: true }).isMongoId().withMessage('Activity id is invalid.'),
  query('operator').optional({ checkFalsy: true }).isMongoId().withMessage('Operator id is invalid.'),
  query('status')
    .optional({ checkFalsy: true })
    .isIn(['pending', 'published', 'hidden'])
    .withMessage('Status is invalid.'),
];

export const updateReviewValidator = [
  requireAtLeastOneField(['rating', 'safetyRating', 'comment', 'status']),
  body('rating').optional().isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5.'),
  body('safetyRating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Safety rating must be between 1 and 5.'),
  body('comment').optional().trim().isLength({ min: 5, max: 1200 }).withMessage('Comment is invalid.'),
  body('status')
    .optional()
    .isIn(['pending', 'published', 'hidden'])
    .withMessage('Status is invalid.'),
];
