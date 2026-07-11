import { Activity } from '../models/Activity.js';
import { Booking } from '../models/Booking.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { calculateBookingTotal, createBooking } from '../services/bookingService.js';
import { getPagination, sendPaginated } from '../utils/pagination.js';

const bookingPopulate = [
  { path: 'user', select: 'fullName email phone' },
  { path: 'activity', select: 'title slug district province riskLevel gallery' },
  { path: 'operator', select: 'companyName licenseNumber location safetyScore' },
];

const buildBookingFilter = (query, user) => {
  const filter = {};

  if (user.role !== 'admin') {
    filter.user = user._id;
  }

  if (query.status) {
    filter.bookingStatus = query.status;
  }

  if (query.paymentStatus) {
    filter.paymentStatus = query.paymentStatus;
  }

  if (query.from || query.to) {
    filter.date = {};
    if (query.from) {
      filter.date.$gte = new Date(query.from);
    }
    if (query.to) {
      filter.date.$lte = new Date(query.to);
    }
  }

  if (query.search) {
    filter.bookingReference = { $regex: query.search, $options: 'i' };
  }

  return filter;
};

export const listBookings = asyncHandler(async (req, res) => {
  const { page, limit } = getPagination(req.query);
  const query = Booking.find(buildBookingFilter(req.query, req.user))
    .populate(bookingPopulate)
    .sort({ createdAt: -1 });

  await sendPaginated({ res, query, page, limit, dataKey: 'bookings' });
});

export const createUserBooking = asyncHandler(async (req, res) => {
  const booking = await createBooking({
    userId: req.user._id,
    payload: req.body,
  });

  const populated = await Booking.findById(booking._id).populate(bookingPopulate);

  res.status(201).json({
    success: true,
    message: 'Booking created successfully.',
    booking: populated,
  });
});

export const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate(bookingPopulate);

  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You cannot access this booking.');
  }

  res.json({
    success: true,
    booking,
  });
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  if (req.body.bookingStatus) {
    booking.bookingStatus = req.body.bookingStatus;
  }

  if (req.body.paymentStatus) {
    booking.paymentStatus = req.body.paymentStatus;
  }

  await booking.save();

  const populated = await Booking.findById(booking._id).populate(bookingPopulate);

  res.json({
    success: true,
    message: 'Booking updated successfully.',
    booking: populated,
  });
});

export const updateBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  if (req.user.role !== 'admin' && booking.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You cannot update this booking.');
  }

  if (req.user.role !== 'admin' && ['completed', 'cancelled'].includes(booking.bookingStatus)) {
    throw new ApiError(400, 'Completed or cancelled bookings cannot be updated.');
  }

  if (req.body.date !== undefined) {
    booking.date = req.body.date;
  }

  if (req.body.travellers !== undefined) {
    booking.travellers = {
      ...booking.travellers.toObject(),
      ...req.body.travellers,
    };
  }

  if (req.body.emergencyContact !== undefined) {
    booking.emergencyContact = {
      ...booking.emergencyContact.toObject(),
      ...req.body.emergencyContact,
    };
  }

  if (req.body.extras !== undefined) {
    booking.extras = req.body.extras;
  }

  if (req.body.travellers?.count !== undefined || req.body.extras !== undefined) {
    const activity = await Activity.findById(booking.activity);

    if (!activity) {
      throw new ApiError(404, 'Activity is not available.');
    }

    booking.totalPrice = calculateBookingTotal(
      activity,
      booking.operator,
      Number(booking.travellers.count),
      booking.extras,
    );
  }

  await booking.save();

  const populated = await Booking.findById(booking._id).populate(bookingPopulate);

  res.json({
    success: true,
    message: 'Booking updated successfully.',
    booking: populated,
  });
});

export const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  if (['confirmed', 'completed'].includes(booking.bookingStatus)) {
    throw new ApiError(400, 'Confirmed or completed bookings should be cancelled instead of deleted.');
  }

  await booking.deleteOne();

  res.json({
    success: true,
    message: 'Booking deleted successfully.',
  });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  if (req.user.role !== 'admin' && booking.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You cannot cancel this booking.');
  }

  booking.bookingStatus = 'cancelled';
  booking.paymentStatus = booking.paymentStatus === 'paid' ? 'refunded' : booking.paymentStatus;
  await booking.save();

  res.json({
    success: true,
    message: 'Booking cancelled successfully.',
    booking,
  });
});
