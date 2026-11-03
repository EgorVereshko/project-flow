import { Router } from 'express';

import { pool } from '../../config/db.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', async (_req, res) => {
  const result = await pool.query<{
    id: string;
    username: string;
    email: string;
  }>(
    `SELECT id, name AS username, email
     FROM users
     ORDER BY name, email`,
  );

  return res.json({ users: result.rows });
});

export default router;
