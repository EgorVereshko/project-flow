import app from './app.js';
import { checkDatabaseConnection, pool } from './config/db.js';
import { env } from './config/env.js';

async function startServer(): Promise<void> {
  await checkDatabaseConnection();

  const server = app.listen(env.port, () => {
    console.log(`ProjectFlow API: http://localhost:${env.port}`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received. Shutting down...`);

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