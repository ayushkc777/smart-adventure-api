import express from 'express';
import {
  createOperator,
  deleteOperator,
  getOperator,
  listOperators,
  updateOperator,
  uploadOperatorLogo,
} from '../controllers/operatorController.js';
import { authorize, optionalProtect, protect } from '../middleware/auth.js';
import { useUploadFolder, upload, validateUploadedFiles } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { mongoIdParam, paginationValidators } from '../validators/commonValidators.js';
import { listOperatorsValidator, operatorUpdateValidator, operatorValidator } from '../validators/operatorValidators.js';

export const operatorRouter = express.Router();

operatorRouter.get('/', optionalProtect, paginationValidators, listOperatorsValidator, validate, listOperators);
operatorRouter.get('/:id', optionalProtect, mongoIdParam(), validate, getOperator);

operatorRouter.use(protect, authorize('admin'));

operatorRouter.post('/', operatorValidator, validate, createOperator);
operatorRouter.patch('/:id', mongoIdParam(), operatorUpdateValidator, validate, updateOperator);
operatorRouter.delete('/:id', mongoIdParam(), validate, deleteOperator);
operatorRouter.post(
  '/:id/logo',
  mongoIdParam(),
  validate,
  useUploadFolder('operators'),
  upload.single('logo'),
  validateUploadedFiles,
  uploadOperatorLogo,
);
