import express from 'express';
import { createReview, deleteReview, listReviews, updateReview } from '../controllers/reviewController.js';
import { optionalProtect, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { mongoIdParam, paginationValidators } from '../validators/commonValidators.js';
import { createReviewValidator, listReviewsValidator, updateReviewValidator } from '../validators/reviewValidators.js';

export const reviewRouter = express.Router();

reviewRouter.get('/', optionalProtect, paginationValidators, listReviewsValidator, validate, listReviews);
reviewRouter.post('/', protect, createReviewValidator, validate, createReview);
reviewRouter.patch('/:id', protect, mongoIdParam(), updateReviewValidator, validate, updateReview);
reviewRouter.delete('/:id', protect, mongoIdParam(), validate, deleteReview);
