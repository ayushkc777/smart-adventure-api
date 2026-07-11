import { SupportMessage } from '../models/SupportMessage.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, sendPaginated } from '../utils/pagination.js';

const buildSupportFilter = (query) => {
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.category) {
    filter.category = query.category;
  }

  return filter;
};

export const createSupportMessage = asyncHandler(async (req, res) => {
  const message = await SupportMessage.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Support message submitted successfully.',
    supportMessage: message,
  });
});

export const listSupportMessages = asyncHandler(async (req, res) => {
  const { page, limit } = getPagination(req.query);
  const query = SupportMessage.find(buildSupportFilter(req.query)).sort({ createdAt: -1 });

  await sendPaginated({ res, query, page, limit, dataKey: 'supportMessages' });
});

export const getSupportMessage = asyncHandler(async (req, res) => {
  const supportMessage = await SupportMessage.findById(req.params.id);

  if (!supportMessage) {
    throw new ApiError(404, 'Support message not found.');
  }

  res.json({
    success: true,
    supportMessage,
  });
});

export const updateSupportMessage = asyncHandler(async (req, res) => {
  const supportMessage = await SupportMessage.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true },
  );

  if (!supportMessage) {
    throw new ApiError(404, 'Support message not found.');
  }

  res.json({
    success: true,
    message: 'Support message updated successfully.',
    supportMessage,
  });
});

export const deleteSupportMessage = asyncHandler(async (req, res) => {
  const supportMessage = await SupportMessage.findByIdAndDelete(req.params.id);

  if (!supportMessage) {
    throw new ApiError(404, 'Support message not found.');
  }

  res.json({
    success: true,
    message: 'Support message deleted successfully.',
  });
});
