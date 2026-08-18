import rateLimit from 'express-rate-limit';

export const createPublicSubmissionLimiter = ({ limit, message, windowMs }) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message,
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
});

export const supportSubmissionLimiter = createPublicSubmissionLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: 'Too many support requests. Please try again later.',
});
