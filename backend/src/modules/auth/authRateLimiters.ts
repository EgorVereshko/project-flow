import { rateLimit } from 'express-rate-limit';

function createAuthRateLimiter(limit: number, message: string) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
        },
      });
    },
  });
}

export const registerRateLimiter = createAuthRateLimiter(
  5,
  'Too many registration attempts. Please try again later.',
);

export const loginRateLimiter = createAuthRateLimiter(
  10,
  'Too many login attempts. Please try again later.',
);
