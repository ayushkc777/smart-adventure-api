import express from 'express';
import {
  deleteNewsletterSubscription,
  listNewsletterSubscriptions,
  subscribeNewsletter,
} from '../controllers/newsletterController.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { mongoIdParam, paginationValidators } from '../validators/commonValidators.js';
import { newsletterValidator } from '../validators/newsletterValidators.js';

export const newsletterRouter = express.Router();

newsletterRouter.post('/', newsletterValidator, validate, subscribeNewsletter);
newsletterRouter.get('/', protect, authorize('admin'), paginationValidators, validate, listNewsletterSubscriptions);
newsletterRouter.delete('/:id', protect, authorize('admin'), mongoIdParam(), validate, deleteNewsletterSubscription);
