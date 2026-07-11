import { NewsletterSubscription } from '../models/NewsletterSubscription.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, sendPaginated } from '../utils/pagination.js';

export const subscribeNewsletter = asyncHandler(async (req, res) => {
  const subscription = await NewsletterSubscription.create({ email: req.body.email });

  res.status(201).json({
    success: true,
    message: 'Newsletter subscription saved successfully.',
    subscription,
  });
});

export const listNewsletterSubscriptions = asyncHandler(async (req, res) => {
  const { page, limit } = getPagination(req.query);
  const query = NewsletterSubscription.find().sort({ createdAt: -1 });

  await sendPaginated({ res, query, page, limit, dataKey: 'subscriptions' });
});

export const deleteNewsletterSubscription = asyncHandler(async (req, res) => {
  const subscription = await NewsletterSubscription.findByIdAndDelete(req.params.id);

  if (!subscription) {
    throw new ApiError(404, 'Newsletter subscription not found.');
  }

  res.json({
    success: true,
    message: 'Newsletter subscription deleted successfully.',
  });
});
