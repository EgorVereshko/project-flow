import { createHash, randomBytes } from 'node:crypto';
import type { Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../../config/env.js';

export interface AccessTokenPayload {
  userId: string;
}

export function createAccessToken(userId: string): string {
  return jwt.sign(
    { userId } satisfies AccessTokenPayload,
    env.jwtAccessSecret,
    {
      expiresIn: env.accessTokenTtl,
      issuer: 'projectflow-api',
      audience: 'projectflow-client',
    },
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.jwtAccessSecret, {
    issuer: 'projectflow-api',
    audience: 'projectflow-client',
  });

  if (
    typeof payload === 'string' ||
    typeof payload.userId !== 'string'
  ) {
    throw new Error('Invalid access token payload');
  }

  return { userId: payload.userId };
}

export function createRefreshToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function setRefreshCookie(
  res: Response,
  token: string,
): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: env.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/api/auth',
  });
}

export function getRefreshTokenFromCookie(
  cookieHeader: string | undefined,
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('refreshToken='));

  if (!cookie) {
    return null;
  }

  const value = cookie.slice('refreshToken='.length);

  return /^[a-f0-9]{64}$/.test(value) ? value : null;
}