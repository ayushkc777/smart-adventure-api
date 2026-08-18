import { Activity } from '../models/Activity.js';
import { Booking } from '../models/Booking.js';
import { Operator } from '../models/Operator.js';
import { Review } from '../models/Review.js';
import { SupportMessage } from '../models/SupportMessage.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    users,
    activeUsers,
    activities,
    operators,
    bookings,
    confirmedRevenue,
    pendingSupport,
    reviews,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: 'active' }),
    Activity.countDocuments({ status: 'active' }),
    Operator.countDocuments({ status: 'active' }),
    Booking.countDocuments(),
    Booking.aggregate([
      {
        $match: {
          bookingStatus: { $in: ['confirmed', 'completed'] },
          paymentStatus: 'paid',
        },
      },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    SupportMessage.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
    Review.countDocuments({ status: 'published' }),
  ]);

  res.json({
    success: true,
    stats: {
      users,
      activeUsers,
      activities,
      operators,
      bookings,
      revenue: confirmedRevenue[0]?.total || 0,
      pendingSupport,
      reviews,
    },
  });
});

export const getAnalytics = asyncHandler(async (req, res) => {
  const [bookingsByStatus, revenueByMonth, topActivities] = await Promise.all([
    Booking.aggregate([{ $group: { _id: '$bookingStatus', count: { $sum: 1 } } }]),
    Booking.aggregate([
      {
        $match: {
          bookingStatus: { $in: ['confirmed', 'completed'] },
          paymentStatus: 'paid',
        },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Booking.aggregate([
      {
        $match: {
          bookingStatus: { $in: ['confirmed', 'completed'] },
          paymentStatus: 'paid',
        },
      },
      { $group: { _id: '$activity', bookings: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
      { $sort: { bookings: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'activities',
          localField: '_id',
          foreignField: '_id',
          as: 'activity',
        },
      },
      { $unwind: '$activity' },
      { $project: { bookings: 1, revenue: 1, title: '$activity.title' } },
    ]),
  ]);

  res.json({
    success: true,
    analytics: {
      bookingsByStatus,
      revenueByMonth,
      topActivities,
    },
  });
});
