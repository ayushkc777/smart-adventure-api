import express from 'express';
import {
  cancelBooking,
  createUserBooking,
  deleteBooking,
  getBooking,
  listBookings,
  updateBooking,
  updateBookingStatus,
} from '../controllers/bookingController.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createBookingValidator,
  listBookingsValidator,
  updateBookingStatusValidator,
  updateBookingValidator,
} from '../validators/bookingValidators.js';
import { mongoIdParam, paginationValidators } from '../validators/commonValidators.js';

export const bookingRouter = express.Router();

bookingRouter.use(protect);

bookingRouter.get('/', paginationValidators, listBookingsValidator, validate, listBookings);
bookingRouter.post('/', createBookingValidator, validate, createUserBooking);
bookingRouter.get('/:id', mongoIdParam(), validate, getBooking);
bookingRouter.patch('/:id', mongoIdParam(), updateBookingValidator, validate, updateBooking);
bookingRouter.patch('/:id/cancel', mongoIdParam(), validate, cancelBooking);
bookingRouter.patch(
  '/:id/status',
  authorize('admin'),
  mongoIdParam(),
  updateBookingStatusValidator,
  validate,
  updateBookingStatus,
);
bookingRouter.delete('/:id', authorize('admin'), mongoIdParam(), validate, deleteBooking);
