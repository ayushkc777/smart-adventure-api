import express from 'express';
import { login, logout, me, register } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { loginValidator, registerValidator } from '../validators/authValidators.js';

export const authRouter = express.Router();

authRouter.post('/register', authLimiter, registerValidator, validate, register);
authRouter.post('/login', authLimiter, loginValidator, validate, login);
authRouter.get('/me', protect, me);
authRouter.post('/logout', protect, logout);
