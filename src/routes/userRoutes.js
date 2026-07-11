import express from 'express';
import {
  changePassword,
  deleteAvatar,
  deleteUser,
  getUser,
  listUsers,
  updateProfile,
  updateUser,
  uploadAvatar,
} from '../controllers/userController.js';
import { authorize, protect } from '../middleware/auth.js';
import { useUploadFolder, upload, validateUploadedFiles } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { mongoIdParam, paginationValidators } from '../validators/commonValidators.js';
import {
  changePasswordValidator,
  listUsersValidator,
  updateUserValidator,
} from '../validators/userValidators.js';

export const userRouter = express.Router();

userRouter.use(protect);

userRouter.patch('/me', updateUserValidator, validate, updateProfile);
userRouter.patch('/me/password', changePasswordValidator, validate, changePassword);
userRouter.post('/me/avatar', useUploadFolder('avatars'), upload.single('avatar'), validateUploadedFiles, uploadAvatar);
userRouter.delete('/me/avatar', deleteAvatar);

userRouter.use(authorize('admin'));

userRouter.get('/', paginationValidators, listUsersValidator, validate, listUsers);
userRouter.get('/:id', mongoIdParam(), validate, getUser);
userRouter.patch('/:id', mongoIdParam(), updateUserValidator, validate, updateUser);
userRouter.delete('/:id', mongoIdParam(), validate, deleteUser);
