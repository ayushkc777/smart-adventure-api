import { Activity } from '../models/Activity.js';
import { Booking } from '../models/Booking.js';
import { Operator } from '../models/Operator.js';
import { ApiError } from '../utils/apiError.js';
import { generateBookingReference } from '../utils/bookingReference.js';

export const calculateBookingTotal = (activity, operatorId, travellerCount, extras = []) => {
  const selectedPrice = activity.operatorPrices?.find(
    (item) => item.operator.toString() === operatorId.toString(),
  );

  if (!selectedPrice) {
    throw new ApiError(400, 'Selected operator is not available for this activity.');
  }

  const count = Number(travellerCount);
  if (!Number.isInteger(count) || count < 1) {
    throw new ApiError(400, 'At least one traveller is required.');
  }

  if (!Array.isArray(extras)) {
    throw new ApiError(400, 'Extras must be an array.');
  }
  if (extras.length > 10) {
    throw new ApiError(400, 'No more than 10 extras may be selected.');
  }
  if (extras.some((extra) => typeof extra !== 'string' || !extra.trim() || extra.trim().length > 60)) {
    throw new ApiError(400, 'Each extra must be a non-empty string up to 60 characters.');
  }
  const normalizedExtras = extras.map((extra) => extra.trim().toLowerCase());
  if (new Set(normalizedExtras).size !== normalizedExtras.length) {
    throw new ApiError(400, 'Extras must not contain duplicates.');
  }

  const extrasTotal = extras.length * 500;
  return Number(selectedPrice.price) * count + extrasTotal;
};

export const createBooking = async ({ userId, payload }) => {
  const [activity, operator] = await Promise.all([
    Activity.findById(payload.activity),
    Operator.findById(payload.operator),
  ]);

  if (!activity || activity.status !== 'active') {
    throw new ApiError(404, 'Activity is not available.');
  }

  if (!operator || operator.status !== 'active') {
    throw new ApiError(404, 'Operator is not available.');
  }

  const travellerCount = Number(payload.travellers.count);
  const totalPrice = calculateBookingTotal(activity, operator._id, travellerCount, payload.extras);

  return Booking.create({
    bookingReference: generateBookingReference(),
    user: userId,
    activity: activity._id,
    operator: operator._id,
    date: payload.date,
    travellers: payload.travellers,
    emergencyContact: payload.emergencyContact,
    extras: payload.extras || [],
    totalPrice,
    bookingStatus: 'awaiting_payment',
    paymentStatus: 'unpaid',
  });
};
