import 'dotenv/config';

const port = Number(process.env.PORT ?? 3000);
const databaseUrl = process.env.DATABASE_URL;
const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid port number');
}

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

if (!jwtAccessSecret || jwtAccessSecret.length < 64) {
  throw new Error('JWT_ACCESS_SECRET must contain at least 64 characters');
}

export const env = {
  port,
  databaseUrl,
  jwtAccessSecret,
  accessTokenTtl: '15m' as const,
  refreshTokenTtlDays: 7,
  isProduction: process.env.NODE_ENV === 'production',
};