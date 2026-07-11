import express from 'express';
import {
  createSupportMessage,
  deleteSupportMessage,
  getSupportMessage,
  listSupportMessages,
  updateSupportMessage,
} from '../controllers/supportController.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { mongoIdParam, paginationValidators } from '../validators/commonValidators.js';
import {
  createSupportMessageValidator,
  listSupportMessagesValidator,
  updateSupportMessageValidator,
} from '../validators/supportValidators.js';

export const supportRouter = express.Router();

supportRouter.post('/', createSupportMessageValidator, validate, createSupportMessage);
supportRouter.get(
  '/',
  protect,
  authorize('admin'),
  paginationValidators,
  listSupportMessagesValidator,
  validate,
  listSupportMessages,
);
supportRouter.get('/:id', protect, authorize('admin'), mongoIdParam(), validate, getSupportMessage);
supportRouter.patch(
  '/:id',
  protect,
  authorize('admin'),
  mongoIdParam(),
  updateSupportMessageValidator,
  validate,
  updateSupportMessage,
);
supportRouter.delete('/:id', protect, authorize('admin'), mongoIdParam(), validate, deleteSupportMessage);
