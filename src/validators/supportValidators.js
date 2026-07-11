import { body, query } from 'express-validator';

export const createSupportMessageValidator = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 30 }).withMessage('Phone is invalid.'),
  body('category')
    .optional()
    .isIn(['booking', 'safety', 'operator', 'account', 'general'])
    .withMessage('Category is invalid.'),
  body('subject').trim().isLength({ min: 3, max: 160 }).withMessage('Subject is required.'),
  body('message').trim().isLength({ min: 10, max: 3000 }).withMessage('Message is required.'),
];

export const listSupportMessagesValidator = [
  query('status')
    .optional({ checkFalsy: true })
    .isIn(['open', 'in_progress', 'resolved', 'closed'])
    .withMessage('Status is invalid.'),
  query('category')
    .optional({ checkFalsy: true })
    .isIn(['booking', 'safety', 'operator', 'account', 'general'])
    .withMessage('Category is invalid.'),
];

export const updateSupportMessageValidator = [
  body('status').isIn(['open', 'in_progress', 'resolved', 'closed']).withMessage('Status is invalid.'),
];
