import { Activity } from '../models/Activity.js';
import { Booking } from '../models/Booking.js';
import { Operator } from '../models/Operator.js';
import { Review } from '../models/Review.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPublicFilePath } from '../middleware/upload.js';
import { recalculateActivityMetrics } from '../services/activityService.js';
import { getPagination, sendPaginated } from '../utils/pagination.js';

const buildOperatorFilter = (query, user) => {
  const filter = {};

  if (user?.role !== 'admin') {
    filter.status = 'active';
  } else if (query.status) {
    filter.status = query.status;
  }

  if (query.search) {
    filter.$or = [
      { companyName: { $regex: query.search, $options: 'i' } },
      { licenseNumber: { $regex: query.search, $options: 'i' } },
      { location: { $regex: query.search, $options: 'i' } },
    ];
  }

  return filter;
};

export const listOperators = asyncHandler(async (req, res) => {
  const { page, limit } = getPagination(req.query);
  const query = Operator.find(buildOperatorFilter(req.query, req.user)).sort({ safetyScore: -1, createdAt: -1 });

  await sendPaginated({ res, query, page, limit, dataKey: 'operators' });
});

export const getOperator = asyncHandler(async (req, res) => {
  const operator = await Operator.findById(req.params.id);

  if (!operator || (operator.status !== 'active' && req.user?.role !== 'admin')) {
    throw new ApiError(404, 'Operator not found.');
  }

  res.json({
    success: true,
    operator,
  });
});

export const createOperator = asyncHandler(async (req, res) => {
  const operator = await Operator.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Operator created successfully.',
    operator,
  });
});

export const updateOperator = asyncHandler(async (req, res) => {
  const operator = await Operator.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!operator) {
    throw new ApiError(404, 'Operator not found.');
  }

  res.json({
    success: true,
    message: 'Operator updated successfully.',
    operator,
  });
});

export const deleteOperator = asyncHandler(async (req, res) => {
  const operator = await Operator.findById(req.params.id);

  if (!operator) {
    throw new ApiError(404, 'Operator not found.');
  }

  const [bookingCount, reviewCount, activityCount, activityPriceCount] = await Promise.all([
    Booking.countDocuments({ operator: operator._id }),
    Review.countDocuments({ operator: operator._id }),
    Activity.countDocuments({ operatorIds: operator._id }),
    Activity.countDocuments({ 'operatorPrices.operator': operator._id }),
  ]);

  if (bookingCount > 0 || reviewCount > 0 || activityCount > 0 || activityPriceCount > 0) {
    operator.status = 'inactive';
    await operator.save();

    return res.json({
      success: true,
      message: 'Operator has related records and was marked inactive instead of deleted.',
      operator,
    });
  }

  const affectedActivities = await Activity.find({ operatorIds: operator._id });
  await Activity.updateMany(
    { operatorIds: operator._id },
    {
      $pull: {
        operatorIds: operator._id,
        operatorPrices: { operator: operator._id },
      },
    },
  );

  await Promise.all(affectedActivities.map((activity) => recalculateActivityMetrics(activity._id)));
  await operator.deleteOne();

  return res.json({
    success: true,
    message: 'Operator deleted successfully.',
  });
});

export const uploadOperatorLogo = asyncHandler(async (req, res) => {
  const operator = await Operator.findById(req.params.id);

  if (!operator) {
    throw new ApiError(404, 'Operator not found.');
  }

  if (!req.file) {
    throw new ApiError(400, 'Logo image is required.');
  }

  operator.logo = getPublicFilePath(req.file, 'operators');
  await operator.save();

  res.json({
    success: true,
    message: 'Operator logo uploaded successfully.',
    operator,
  });
});
