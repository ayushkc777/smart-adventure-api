import { body } from 'express-validator';

export const registerValidator = [
  body('fullName').trim().isLength({ min: 2, max: 80 }).withMessage('Full name is required.'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
  body('nationality').optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
  body('preferredLanguage').optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
];

export const loginValidator = [
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
];
