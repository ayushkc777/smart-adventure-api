import mongoose from 'mongoose';
import { Activity } from '../models/Activity.js';
import { Booking } from '../models/Booking.js';
import { Review } from '../models/Review.js';
import { Wishlist } from '../models/Wishlist.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPublicFilePath } from '../middleware/upload.js';
import { recalculateActivityMetrics } from '../services/activityService.js';
import { getPagination, sendPaginated } from '../utils/pagination.js';

const buildActivityFilter = (query, user) => {
  const filter = {};

  if (user?.role !== 'admin') {
    filter.status = 'active';
  } else if (query.status) {
    filter.status = query.status;
  }

  ['province', 'district', 'difficulty', 'riskLevel'].forEach((field) => {
    if (query[field]) {
      filter[field] = query[field];
    }
  });

  if (query.featured) {
    filter.featured = query.featured === 'true';
  }

  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
      { district: { $regex: query.search, $options: 'i' } },
      { province: { $regex: query.search, $options: 'i' } },
    ];
  }

  return filter;
};

const populateActivity = (query) =>
  query.populate('operatorIds').populate({
    path: 'operatorPrices.operator',
    select: 'companyName licenseNumber location safetyScore responseRate status logo',
  });

export const listActivities = asyncHandler(async (req, res) => {
  const { page, limit } = getPagination(req.query);
  const query = populateActivity(Activity.find(buildActivityFilter(req.query, req.user)).sort({ featured: -1, createdAt: -1 }));

  await sendPaginated({ res, query, page, limit, dataKey: 'activities' });
});

export const getActivity = asyncHandler(async (req, res) => {
  const lookup = mongoose.isValidObjectId(req.params.idOrSlug)
    ? { _id: req.params.idOrSlug }
    : { slug: req.params.idOrSlug };

  const activity = await populateActivity(Activity.findOne(lookup));

  if (!activity || (activity.status !== 'active' && req.user?.role !== 'admin')) {
    throw new ApiError(404, 'Activity not found.');
  }

  res.json({
    success: true,
    activity,
  });
});

export const createActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.create(req.body);
  await recalculateActivityMetrics(activity._id);

  const populated = await populateActivity(Activity.findById(activity._id));

  res.status(201).json({
    success: true,
    message: 'Activity created successfully.',
    activity: populated,
  });
});

export const updateActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);

  if (!activity) {
    throw new ApiError(404, 'Activity not found.');
  }

  Object.entries(req.body).forEach(([field, value]) => {
    if (value !== undefined && field !== 'priceFrom' && field !== 'ratingAverage' && field !== 'reviewCount') {
      activity[field] = value;
    }
  });

  await activity.save();
  await recalculateActivityMetrics(activity._id);

  const populated = await populateActivity(Activity.findById(activity._id));

  res.json({
    success: true,
    message: 'Activity updated successfully.',
    activity: populated,
  });
});

export const deleteActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);

  if (!activity) {
    throw new ApiError(404, 'Activity not found.');
  }

  const [bookingCount, reviewCount, wishlistCount] = await Promise.all([
    Booking.countDocuments({ activity: activity._id }),
    Review.countDocuments({ activity: activity._id }),
    Wishlist.countDocuments({ activities: activity._id }),
  ]);

  if (bookingCount > 0 || reviewCount > 0 || wishlistCount > 0) {
    activity.status = 'archived';
    await activity.save();

    return res.json({
      success: true,
      message: 'Activity has related records and was archived instead of deleted.',
      activity,
    });
  }

  await activity.deleteOne();

  return res.json({
    success: true,
    message: 'Activity deleted successfully.',
  });
});

export const uploadActivityGallery = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);

  if (!activity) {
    throw new ApiError(404, 'Activity not found.');
  }

  if (!req.files?.length) {
    throw new ApiError(400, 'At least one gallery image is required.');
  }

  const uploadedImages = req.files.map((file) => ({
    url: getPublicFilePath(file, 'activities'),
    alt: activity.title,
  }));

  activity.gallery.push(...uploadedImages);
  await activity.save();

  res.json({
    success: true,
    message: 'Activity gallery updated successfully.',
    activity,
  });
});
