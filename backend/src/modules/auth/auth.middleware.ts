import type {
  Request,
  Response,
  NextFunction,
} from 'express';

import { verifyAccessToken } from './auth.utils.js';

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  const token = authorization.slice('Bearer '.length).trim();

  if (!token) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    res.locals.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({
      error: {
        code: 'INVALID_ACCESS_TOKEN',
        message: 'Access token is invalid or expired',
      },
    });
  }
}