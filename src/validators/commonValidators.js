import { body, param, query } from 'express-validator';

export const requireAtLeastOneField = (fields) =>
  body().custom((value) => {
    const payload = value && typeof value === 'object' ? value : {};
    if (!fields.some((field) => Object.prototype.hasOwnProperty.call(payload, field))) {
      throw new Error('At least one supported field is required.');
    }
    return true;
  });

export const mongoIdParam = (name = 'id') => [
  param(name).isMongoId().withMessage(`${name} must be a valid MongoDB id.`),
];

export const paginationValidators = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
];
