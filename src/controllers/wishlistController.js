import { Activity } from '../models/Activity.js';
import { Wishlist } from '../models/Wishlist.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $setOnInsert: { user: req.user._id, activities: [] } },
    { new: true, upsert: true },
  ).populate('activities');

  res.json({
    success: true,
    wishlist,
  });
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.activityId);

  if (!activity || activity.status !== 'active') {
    throw new ApiError(404, 'Activity not found.');
  }

  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $addToSet: { activities: activity._id } },
    { new: true, upsert: true },
  ).populate('activities');

  res.json({
    success: true,
    message: 'Activity added to wishlist.',
    wishlist,
  });
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { activities: req.params.activityId } },
    { new: true, upsert: true },
  ).populate('activities');

  res.json({
    success: true,
    message: 'Activity removed from wishlist.',
    wishlist,
  });
});
