import { body, query } from 'express-validator';
import { requireAtLeastOneField } from './commonValidators.js';

const difficultyValues = ['Easy', 'Moderate', 'Challenging', 'Extreme'];
const riskValues = ['Low', 'Medium', 'High'];
const statusValues = ['active', 'inactive', 'archived'];

export const listActivitiesValidator = [
  query('search').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  query('province').optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
  query('district').optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
  query('difficulty').optional({ checkFalsy: true }).isIn(difficultyValues).withMessage('Difficulty is invalid.'),
  query('riskLevel').optional({ checkFalsy: true }).isIn(riskValues).withMessage('Risk level is invalid.'),
  query('featured').optional({ checkFalsy: true }).isBoolean().withMessage('Featured must be boolean.'),
  query('status').optional({ checkFalsy: true }).isIn(statusValues).withMessage('Status is invalid.'),
];

const activityRules = (isUpdate = false) => {
  const rules = [
  body('title').trim().isLength({ min: 2, max: 140 }).withMessage('Title is required.'),
  body('description').trim().isLength({ min: 20, max: 3000 }).withMessage('Description is required.'),
  body('province').trim().isLength({ min: 2, max: 80 }).withMessage('Province is required.'),
  body('district').trim().isLength({ min: 2, max: 80 }).withMessage('District is required.'),
  body('difficulty').isIn(difficultyValues).withMessage('Difficulty is invalid.'),
  body('duration').trim().isLength({ min: 2, max: 80 }).withMessage('Duration is required.'),
  body('safetyScore').optional().isFloat({ min: 0, max: 100 }).withMessage('Safety score must be 0-100.'),
  body('riskLevel').isIn(riskValues).withMessage('Risk level is invalid.'),
  body('bestSeason').optional().isArray().withMessage('Best season must be an array.'),
  body('gallery').optional().isArray().withMessage('Gallery must be an array.'),
  body('featured').optional().isBoolean().withMessage('Featured must be boolean.'),
  body('status').optional().isIn(statusValues).withMessage('Status is invalid.'),
  body('operatorPrices').optional().isArray().withMessage('Operator prices must be an array.'),
  body('operatorPrices.*.operator').optional().isMongoId().withMessage('Operator id must be valid.'),
  body('operatorPrices.*.price').optional().isFloat({ min: 0 }).withMessage('Operator price must be positive.'),
  ];

  return isUpdate ? rules.map((rule) => rule.optional()) : rules;
};

export const activityValidator = activityRules();
export const activityUpdateValidator = [
  requireAtLeastOneField([
    'title',
    'description',
    'province',
    'district',
    'difficulty',
    'duration',
    'safetyScore',
    'riskLevel',
    'bestSeason',
    'gallery',
    'featured',
    'status',
    'operatorPrices',
  ]),
  ...activityRules(true),
];
