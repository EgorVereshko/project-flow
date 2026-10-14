import { Router } from 'express';
import bcrypt from 'bcryptjs';

import { pool } from '../../config/db.js';
import { env } from '../../config/env.js';
import { authenticate } from './auth.middleware.js';
import {
  clearRefreshCookie,
  createAccessToken,
  createRefreshToken,
  getRefreshTokenFromCookie,
  hashRefreshToken,
  setRefreshCookie,
} from './auth.utils.js';

const router = Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function invalidInput(res: Parameters<typeof router.post>[1] extends never ? never : any) {
  return res.status(400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Please check the submitted fields',
    },
  });
}

router.post('/register', async (req, res) => {
  const name =
    typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email =
    typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';
  const password =
    typeof req.body?.password === 'string' ? req.body.password : '';

  if (
    !name ||
    name.length > 100 ||
    !emailPattern.test(email) ||
    email.length > 255 ||
    password.length < 8 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message:
          'Provide a valid name and email, and a password of 8–72 bytes',
      },
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query<{
      id: string;
      name: string;
      email: string;
    }>(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name, email, passwordHash],
    );

    const user = result.rows[0];

    const refreshToken = createRefreshToken();

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [
        user.id,
        hashRefreshToken(refreshToken),
        addDays(new Date(), env.refreshTokenTtlDays),
      ],
    );

    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      user,
      accessToken: createAccessToken(user.id),
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    ) {
      return res.status(409).json({
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email already exists',
        },
      });
    }

    throw error;
  }
});

router.post('/login', async (req, res) => {
  const email =
    typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';
  const password =
    typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password || email.length > 255) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required',
      },
    });
  }

  const result = await pool.query<{
    id: string;
    name: string;
    email: string;
    password_hash: string;
  }>(
    `SELECT id, name, email, password_hash
     FROM users
     WHERE email = $1`,
    [email],
  );

  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect',
      },
    });
  }

  const refreshToken = createRefreshToken();

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [
      user.id,
      hashRefreshToken(refreshToken),
      addDays(new Date(), env.refreshTokenTtlDays),
    ],
  );

  setRefreshCookie(res, refreshToken);

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    accessToken: createAccessToken(user.id),
  });
});

router.post('/refresh', async (req, res) => {
  const oldToken = getRefreshTokenFromCookie(req.headers.cookie);

  if (!oldToken) {
    clearRefreshCookie(res);
    return res.status(401).json({
      error: {
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is missing or invalid',
      },
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query<{
      id: string;
      user_id: string;
      name: string;
      email: string;
    }>(
      `SELECT rt.id, rt.user_id, u.name, u.email
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1
         AND rt.expires_at > NOW()
       FOR UPDATE OF rt`,
      [hashRefreshToken(oldToken)],
    );

    const session = result.rows[0];

    if (!session) {
      await client.query('ROLLBACK');
      clearRefreshCookie(res);

      return res.status(401).json({
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token is expired or invalid',
        },
      });
    }

    const newRefreshToken = createRefreshToken();

    await client.query(
      `UPDATE refresh_tokens
       SET token_hash = $1, expires_at = $2
       WHERE id = $3`,
      [
        hashRefreshToken(newRefreshToken),
        addDays(new Date(), env.refreshTokenTtlDays),
        session.id,
      ],
    );

    await client.query('COMMIT');

    setRefreshCookie(res, newRefreshToken);

    return res.json({
      user: {
        id: session.user_id,
        name: session.name,
        email: session.email,
      },
      accessToken: createAccessToken(session.user_id),
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
});

router.post('/logout', async (req, res) => {
  const refreshToken = getRefreshTokenFromCookie(req.headers.cookie);

  if (refreshToken) {
    await pool.query(
      'DELETE FROM refresh_tokens WHERE token_hash = $1',
      [hashRefreshToken(refreshToken)],
    );
  }

  clearRefreshCookie(res);

  return res.status(204).end();
});

router.get('/me', authenticate, async (_req, res) => {
  const userId = res.locals.userId as string;

  const result = await pool.query<{
    id: string;
    name: string;
    email: string;
    created_at: Date;
  }>(
    `SELECT id, name, email, created_at
     FROM users
     WHERE id = $1`,
    [userId],
  );

  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User account no longer exists',
      },
    });
  }

  return res.json({ user });
});

export default router;