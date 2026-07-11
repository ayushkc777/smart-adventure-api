import { Activity } from '../models/Activity.js';
import { Booking } from '../models/Booking.js';
import { Review } from '../models/Review.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recalculateActivityMetrics } from '../services/activityService.js';
import { getPagination, sendPaginated } from '../utils/pagination.js';

const reviewPopulate = [
  { path: 'user', select: 'fullName avatar' },
  { path: 'activity', select: 'title slug' },
  { path: 'operator', select: 'companyName' },
];

const buildReviewFilter = (query, user) => {
  const filter = {};

  if (query.activity) {
    filter.activity = query.activity;
  }

  if (query.operator) {
    filter.operator = query.operator;
  }

  if (user?.role === 'admin' && query.status) {
    filter.status = query.status;
  } else {
    filter.status = 'published';
  }

  return filter;
};

export const listReviews = asyncHandler(async (req, res) => {
  const { page, limit } = getPagination(req.query);
  const query = Review.find(buildReviewFilter(req.query, req.user)).populate(reviewPopulate).sort({ createdAt: -1 });

  await sendPaginated({ res, query, page, limit, dataKey: 'reviews' });
});

export const createReview = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.body.activity);

  if (!activity || activity.status !== 'active') {
    throw new ApiError(404, 'Activity not found.');
  }

  const operatorBelongsToActivity = activity.operatorPrices.some(
    (item) => item.operator.toString() === req.body.operator,
  );

  if (!operatorBelongsToActivity) {
    throw new ApiError(400, 'Selected operator is not available for this activity.');
  }

  const completedBooking = await Booking.exists({
    user: req.user._id,
    activity: req.body.activity,
    operator: req.body.operator,
    bookingStatus: 'completed',
  });

  if (!completedBooking) {
    throw new ApiError(403, 'A completed booking is required before posting a review.');
  }

  const existingReview = await Review.exists({
    user: req.user._id,
    activity: req.body.activity,
    operator: req.body.operator,
  });

  if (existingReview) {
    throw new ApiError(409, 'You have already reviewed this activity with this operator.');
  }

  const review = await Review.create({
    user: req.user._id,
    activity: req.body.activity,
    operator: req.body.operator,
    rating: req.body.rating,
    safetyRating: req.body.safetyRating,
    comment: req.body.comment,
    status: req.user.role === 'admin' ? req.body.status || 'published' : 'published',
  });

  await recalculateActivityMetrics(review.activity);

  const populated = await Review.findById(review._id).populate(reviewPopulate);

  res.status(201).json({
    success: true,
    message: 'Review created successfully.',
    review: populated,
  });
});

export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new ApiError(404, 'Review not found.');
  }

  if (req.user.role !== 'admin' && review.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You cannot update this review.');
  }

  ['rating', 'safetyRating', 'comment', 'status'].forEach((field) => {
    if (req.body[field] !== undefined) {
      review[field] = req.body[field];
    }
  });

  if (req.user.role !== 'admin') {
    review.status = 'published';
  }

  await review.save();
  await recalculateActivityMetrics(review.activity);

  const populated = await Review.findById(review._id).populate(reviewPopulate);

  res.json({
    success: true,
    message: 'Review updated successfully.',
    review: populated,
  });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new ApiError(404, 'Review not found.');
  }

  if (req.user.role !== 'admin' && review.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You cannot delete this review.');
  }

  const activityId = review.activity;
  await review.deleteOne();
  await recalculateActivityMetrics(activityId);

  res.json({
    success: true,
    message: 'Review deleted successfully.',
  });
});
