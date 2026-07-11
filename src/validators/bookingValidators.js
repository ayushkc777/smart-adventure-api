import { body, query } from 'express-validator';

const bookingStatuses = ['pending', 'awaiting_payment', 'confirmed', 'completed', 'cancelled'];
const paymentStatuses = ['unpaid', 'paid', 'refunded', 'failed'];

export const createBookingValidator = [
  body('activity').isMongoId().withMessage('Activity id is required.'),
  body('operator').isMongoId().withMessage('Operator id is required.'),
  body('date')
    .isISO8601()
    .withMessage('Booking date must be valid.')
    .custom((value) => new Date(value) >= new Date(new Date().toDateString()))
    .withMessage('Booking date cannot be in the past.'),
  body('travellers.count').isInt({ min: 1 }).withMessage('At least one traveller is required.'),
  body('travellers.leadName').trim().isLength({ min: 2, max: 80 }).withMessage('Lead traveller is required.'),
  body('travellers.email').isEmail().normalizeEmail().withMessage('Traveller email is required.'),
  body('travellers.phone').trim().isLength({ min: 5, max: 30 }).withMessage('Traveller phone is required.'),
  body('emergencyContact.name').trim().isLength({ min: 2, max: 80 }).withMessage('Emergency name is required.'),
  body('emergencyContact.phone')
    .trim()
    .isLength({ min: 5, max: 30 })
    .withMessage('Emergency phone is required.'),
  body('emergencyContact.relationship').optional({ checkFalsy: true }).trim().isLength({ max: 60 }),
  body('extras').optional().isArray().withMessage('Extras must be an array.'),
];

export const listBookingsValidator = [
  query('status').optional({ checkFalsy: true }).isIn(bookingStatuses).withMessage('Booking status is invalid.'),
  query('paymentStatus')
    .optional({ checkFalsy: true })
    .isIn(paymentStatuses)
    .withMessage('Payment status is invalid.'),
  query('from').optional({ checkFalsy: true }).isISO8601().withMessage('From date is invalid.'),
  query('to').optional({ checkFalsy: true }).isISO8601().withMessage('To date is invalid.'),
  query('search').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
];

export const updateBookingStatusValidator = [
  body('bookingStatus').optional().isIn(bookingStatuses).withMessage('Booking status is invalid.'),
  body('paymentStatus').optional().isIn(paymentStatuses).withMessage('Payment status is invalid.'),
];

export const updateBookingValidator = [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Booking date must be valid.')
    .custom((value) => new Date(value) >= new Date(new Date().toDateString()))
    .withMessage('Booking date cannot be in the past.'),
  body('travellers.count').optional().isInt({ min: 1 }).withMessage('At least one traveller is required.'),
  body('travellers.leadName').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Lead traveller is invalid.'),
  body('travellers.email').optional().isEmail().normalizeEmail().withMessage('Traveller email is invalid.'),
  body('travellers.phone').optional().trim().isLength({ min: 5, max: 30 }).withMessage('Traveller phone is invalid.'),
  body('emergencyContact.name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Emergency name is invalid.'),
  body('emergencyContact.phone')
    .optional()
    .trim()
    .isLength({ min: 5, max: 30 })
    .withMessage('Emergency phone is invalid.'),
  body('emergencyContact.relationship').optional({ checkFalsy: true }).trim().isLength({ max: 60 }),
  body('extras').optional().isArray().withMessage('Extras must be an array.'),
];
