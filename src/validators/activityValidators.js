import { body, query } from 'express-validator';
import { requireAtLeastOneField } from './commonValidators.js';

const difficultyValues = ['Easy', 'Moderate', 'Challenging', 'Extreme'];
const riskValues = ['Low', 'Medium', 'High'];
const statusValues = ['active', 'inactive', 'archived'];
const maxOperatorPrices = 25;

const operatorPriceRules = () => [
  body('operatorPrices')
    .optional()
    .isArray({ max: maxOperatorPrices })
    .withMessage(`Operator prices must be an array with no more than ${maxOperatorPrices} items.`)
    .bail()
    .custom((prices) => {
      const operatorIds = prices.map((price) => String(price?.operator ?? ''));
      return new Set(operatorIds).size === operatorIds.length;
    })
    .withMessage('Operator prices must not contain duplicate operators.'),
  body('operatorPrices.*.operator').isMongoId().withMessage('Operator id must be valid.'),
  body('operatorPrices.*.packageName')
    .optional()
    .isString()
    .withMessage('Package name must be text.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Package name must be between 1 and 100 characters.'),
  body('operatorPrices.*.price')
    .isFloat({ min: 0, max: 100000000 })
    .withMessage('Operator price must be between 0 and 100000000.'),
  body('operatorPrices.*.currency')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(['NPR'])
    .withMessage('Operator price currency must be NPR.'),
  body('operatorPrices.*.includedServices')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Included services must be an array with no more than 20 items.')
    .bail()
    .custom((services) => new Set(services.map((service) => String(service).trim().toLowerCase())).size === services.length)
    .withMessage('Included services must not contain duplicates.'),
  body('operatorPrices.*.includedServices.*')
    .isString()
    .withMessage('Each included service must be text.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each included service must be between 1 and 100 characters.'),
];

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
  ...operatorPriceRules(),
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
