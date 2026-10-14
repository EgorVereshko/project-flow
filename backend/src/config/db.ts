import pg from 'pg';

import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error);
});

export async function checkDatabaseConnection(): Promise<void> {
  const result = await pool.query<{ now: Date }>(
    'SELECT NOW() AS now',
  );

  console.log('PostgreSQL connected:', result.rows[0]?.now);
}