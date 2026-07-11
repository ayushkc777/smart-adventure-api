import express from 'express';
import {
  createActivity,
  deleteActivity,
  getActivity,
  listActivities,
  updateActivity,
  uploadActivityGallery,
} from '../controllers/activityController.js';
import { authorize, optionalProtect, protect } from '../middleware/auth.js';
import { useUploadFolder, upload, validateUploadedFiles } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { activityUpdateValidator, activityValidator, listActivitiesValidator } from '../validators/activityValidators.js';
import { mongoIdParam, paginationValidators } from '../validators/commonValidators.js';

export const activityRouter = express.Router();

activityRouter.get('/', optionalProtect, paginationValidators, listActivitiesValidator, validate, listActivities);
activityRouter.get('/:idOrSlug', optionalProtect, getActivity);

activityRouter.use(protect, authorize('admin'));

activityRouter.post('/', activityValidator, validate, createActivity);
activityRouter.patch('/:id', mongoIdParam(), activityUpdateValidator, validate, updateActivity);
activityRouter.delete('/:id', mongoIdParam(), validate, deleteActivity);
activityRouter.post(
  '/:id/gallery',
  mongoIdParam(),
  validate,
  useUploadFolder('activities'),
  upload.array('gallery', 8),
  validateUploadedFiles,
  uploadActivityGallery,
);
