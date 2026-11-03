import { pool } from '../../config/db.js';

export async function cleanupExpiredRefreshTokens(): Promise<number> {
  const result = await pool.query(
    'DELETE FROM refresh_tokens WHERE expires_at <= NOW()',
  );

  return result.rowCount ?? 0;
}
