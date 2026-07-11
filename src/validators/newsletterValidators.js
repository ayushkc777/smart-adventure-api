import { body } from 'express-validator';

export const newsletterValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
];
