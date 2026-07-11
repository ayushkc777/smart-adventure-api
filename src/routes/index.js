import express from 'express';
import { activityRouter } from './activityRoutes.js';
import { adminRouter } from './adminRoutes.js';
import { authRouter } from './authRoutes.js';
import { bookingRouter } from './bookingRoutes.js';
import { newsletterRouter } from './newsletterRoutes.js';
import { notificationRouter } from './notificationRoutes.js';
import { operatorRouter } from './operatorRoutes.js';
import { reviewRouter } from './reviewRoutes.js';
import { supportRouter } from './supportRoutes.js';
import { userRouter } from './userRoutes.js';
import { wishlistRouter } from './wishlistRoutes.js';

export const apiRouter = express.Router();

apiRouter.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Adventure API is running.',
    timestamp: new Date().toISOString(),
  });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/activities', activityRouter);
apiRouter.use('/operators', operatorRouter);
apiRouter.use('/bookings', bookingRouter);
apiRouter.use('/reviews', reviewRouter);
apiRouter.use('/wishlist', wishlistRouter);
apiRouter.use('/support', supportRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/newsletter', newsletterRouter);
apiRouter.use('/admin', adminRouter);
