import type { RequestParamHandler } from 'express';

export function isUuid(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function validateUuidParam(label: string): RequestParamHandler {
  return (req, res, next, value) => {
    if (!isUuid(value)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: `${label} must be a valid UUID`,
        },
      });
      return;
    }

    next();
  };
}
