import mongoose from 'mongoose';
import { Activity } from '../models/Activity.js';
import { Review } from '../models/Review.js';

export const recalculateActivityMetrics = async (activityId) => {
  const normalizedActivityId =
    typeof activityId === 'string' ? new mongoose.Types.ObjectId(activityId) : activityId;

  const [activity, reviewStats] = await Promise.all([
    Activity.findById(normalizedActivityId),
    Review.aggregate([
      {
        $match: {
          activity: normalizedActivityId,
          status: 'published',
        },
      },
      {
        $group: {
          _id: '$activity',
          ratingAverage: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  if (!activity) {
    return null;
  }

  const prices = activity.operatorPrices.map((item) => item.price);
  activity.priceFrom = prices.length ? Math.min(...prices) : 0;
  activity.operatorIds = [...new Set(activity.operatorPrices.map((item) => item.operator.toString()))];

  const stats = reviewStats[0];
  activity.ratingAverage = stats ? Number(stats.ratingAverage.toFixed(1)) : 0;
  activity.reviewCount = stats?.reviewCount || 0;

  await activity.save();
  return activity;
};

export const ensureGalleryFallback = (activity) => {
  if (activity.gallery?.length) {
    return activity.gallery;
  }

  return [
    {
      url: '/uploads/activities/default-adventure.jpg',
      alt: `${activity.title} in Nepal`,
    },
  ];
};
