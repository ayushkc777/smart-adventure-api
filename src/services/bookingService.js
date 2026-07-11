import { Activity } from '../models/Activity.js';
import { Booking } from '../models/Booking.js';
import { Operator } from '../models/Operator.js';
import { ApiError } from '../utils/apiError.js';
import { generateBookingReference } from '../utils/bookingReference.js';

export const calculateBookingTotal = (activity, operatorId, travellerCount, extras = []) => {
  const selectedPrice = activity.operatorPrices.find(
    (item) => item.operator.toString() === operatorId.toString(),
  );

  if (!selectedPrice) {
    throw new ApiError(400, 'Selected operator is not available for this activity.');
  }

  const extrasTotal = extras.length * 500;
  return selectedPrice.price * travellerCount + extrasTotal;
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
