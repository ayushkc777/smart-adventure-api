import express from 'express';
import { addToWishlist, getWishlist, removeFromWishlist } from '../controllers/wishlistController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { mongoIdParam } from '../validators/commonValidators.js';

export const wishlistRouter = express.Router();

wishlistRouter.use(protect);

wishlistRouter.get('/', getWishlist);
wishlistRouter.post('/:activityId', mongoIdParam('activityId'), validate, addToWishlist);
wishlistRouter.delete('/:activityId', mongoIdParam('activityId'), validate, removeFromWishlist);
