import { body, query } from 'express-validator';

export const listOperatorsValidator = [
  query('search').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  query('status')
    .optional({ checkFalsy: true })
    .isIn(['active', 'suspended', 'inactive'])
    .withMessage('Status is invalid.'),
];

const operatorRules = (isUpdate = false) => {
  const optional = isUpdate ? { optional: true } : {};

  return [
  body('companyName').trim().isLength({ min: 2, max: 120 }).withMessage('Company name is required.'),
  body('licenseNumber').trim().isLength({ min: 2, max: 80 }).withMessage('License number is required.'),
  body('location').trim().isLength({ min: 2, max: 120 }).withMessage('Location is required.'),
  body('safetyScore').optional().isFloat({ min: 0, max: 100 }).withMessage('Safety score must be 0-100.'),
  body('responseRate').optional().isFloat({ min: 0, max: 100 }).withMessage('Response rate must be 0-100.'),
  body('yearsExperience').optional().isInt({ min: 0 }).withMessage('Years experience must be positive.'),
  body('languages').optional().isArray().withMessage('Languages must be an array.'),
  body('insuranceAvailable').optional().isBoolean().withMessage('Insurance availability must be boolean.'),
  body('status')
    .optional()
    .isIn(['active', 'suspended', 'inactive'])
    .withMessage('Status is invalid.'),
  ].map((rule) => (optional.optional ? rule.optional() : rule));
};

export const operatorValidator = operatorRules();
export const operatorUpdateValidator = operatorRules(true);
