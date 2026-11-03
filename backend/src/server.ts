import app from './app.js';
import { checkDatabaseConnection, pool } from './config/db.js';
import { env } from './config/env.js';
import { cleanupExpiredRefreshTokens } from './modules/auth/refreshTokenCleanup.js';

const refreshTokenCleanupIntervalMs = 60 * 60 * 1000;

async function runRefreshTokenCleanup(): Promise<void> {
  try {
    const deletedCount = await cleanupExpiredRefreshTokens();
    if (deletedCount > 0) {
      console.log(`Removed ${deletedCount} expired refresh tokens`);
    }
  } catch (error) {
    console.error('Failed to clean up expired refresh tokens:', error);
  }
}

async function startServer(): Promise<void> {
  await checkDatabaseConnection();
  await runRefreshTokenCleanup();

  const refreshTokenCleanupInterval = setInterval(() => {
    void runRefreshTokenCleanup();
  }, refreshTokenCleanupIntervalMs);
  refreshTokenCleanupInterval.unref();

  const server = app.listen(env.port, () => {
    console.log(`ProjectFlow API: http://localhost:${env.port}`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received. Shutting down...`);
    clearInterval(refreshTokenCleanupInterval);

    server.close(() => {
      void pool.end().finally(() => {
        process.exit(0);
      });
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch(async (error: unknown) => {
  console.error('Failed to start ProjectFlow API:', error);
  await pool.end();
  process.exitCode = 1;
});