import express from 'express';
import { getAnalytics, getDashboardStats } from '../controllers/adminController.js';
import { authorize, protect } from '../middleware/auth.js';

export const adminRouter = express.Router();

adminRouter.use(protect, authorize('admin'));

adminRouter.get('/dashboard', getDashboardStats);
adminRouter.get('/analytics', getAnalytics);
