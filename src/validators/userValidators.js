import { body, query } from 'express-validator';
import { requireAtLeastOneField } from './commonValidators.js';

export const listUsersValidator = [
  query('search').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  query('role').optional({ checkFalsy: true }).isIn(['user', 'admin']).withMessage('Role is invalid.'),
  query('status')
    .optional({ checkFalsy: true })
    .isIn(['active', 'suspended'])
    .withMessage('Status is invalid.'),
];

const profileFields = [
  'fullName',
  'phone',
  'nationality',
  'preferredLanguage',
  'emergencyContact',
];

const profileRules = () => [
  body('fullName').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Full name is invalid.'),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
  body('nationality').optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
  body('preferredLanguage').optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
  body('emergencyContact.name').optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
  body('emergencyContact.phone').optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
  body('emergencyContact.relationship').optional({ checkFalsy: true }).trim().isLength({ max: 60 }),
];

export const profileUpdateValidator = [
  requireAtLeastOneField(profileFields),
  ...profileRules(),
  body('role').not().exists().withMessage('Role cannot be changed through the profile endpoint.'),
  body('status').not().exists().withMessage('Status cannot be changed through the profile endpoint.'),
];

export const adminUserUpdateValidator = [
  requireAtLeastOneField([...profileFields, 'role', 'status']),
  ...profileRules(),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role is invalid.'),
  body('status').optional().isIn(['active', 'suspended']).withMessage('Status is invalid.'),
];

export const changePasswordValidator = [
  body('currentPassword').isLength({ min: 8 }).withMessage('Current password is required.'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
];
