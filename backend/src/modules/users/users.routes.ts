import { Router } from 'express';
import { z } from 'zod';

import { pool } from '../../config/db.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = Router();

router.use(authenticate);

const profileNameSchema = z.string().trim().min(1).max(100);

type ProfileTaskRow = {
  id: string;
  title: string;
  board_id: string;
  board_name: string;
  column_id: string;
  column_title: string;
  workflow_status: 'todo' | 'in_progress' | 'done';
  status: 'todo' | 'in_progress' | 'done' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  deadline: Date | null;
  assignee_name?: string | null;
};

function toProfileTask(task: ProfileTaskRow) {
  return {
    id: task.id,
    title: task.title,
    boardId: task.board_id,
    boardName: task.board_name,
    columnId: task.column_id,
    columnTitle: task.column_title,
    workflowStatus: task.workflow_status,
    status: task.status,
    priority: task.priority,
    deadline: task.deadline?.toISOString().slice(0, 10) ?? null,
    ...(typeof task.assignee_name === 'string'
      ? { assigneeName: task.assignee_name }
      : {}),
  };
}

router.get('/me/profile', async (_req, res) => {
  const userId = res.locals.userId as string;
  const userResult = await pool.query<{
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
  const user = userResult.rows[0];

  if (!user) {
    return res.status(404).json({
      error: { code: 'USER_NOT_FOUND', message: 'User not found' },
    });
  }

  const taskStatusSql = `CASE
    WHEN bc.workflow_status <> 'done'
      AND t.deadline IS NOT NULL
      AND t.deadline < CURRENT_DATE
      THEN 'overdue'
    ELSE bc.workflow_status
  END`;

  const [statsResult, boardsResult, assignedResult, createdResult] =
    await Promise.all([
      pool.query<{
        total_tasks: number;
        completed: number;
        in_progress: number;
        todo: number;
        overdue: number;
      }>(
        `SELECT
           COUNT(*)::int AS total_tasks,
           COUNT(*) FILTER (
             WHERE bc.workflow_status = 'done'
           )::int AS completed,
           COUNT(*) FILTER (
             WHERE bc.workflow_status = 'in_progress'
           )::int AS in_progress,
           COUNT(*) FILTER (
             WHERE bc.workflow_status = 'todo'
           )::int AS todo,
           COUNT(*) FILTER (
             WHERE bc.workflow_status <> 'done'
               AND t.deadline IS NOT NULL
               AND t.deadline < CURRENT_DATE
           )::int AS overdue
         FROM tasks t
         JOIN board_columns bc ON bc.id = t.column_id
         WHERE t.assignee_id = $1`,
        [userId],
      ),
      pool.query<{
        id: string;
        name: string;
        description: string;
        task_count: number;
        completed_count: number;
      }>(
        `SELECT
           b.id,
           b.name,
           b.description,
           COUNT(t.id)::int AS task_count,
           COUNT(t.id) FILTER (
             WHERE bc.workflow_status = 'done'
           )::int AS completed_count
         FROM boards b
         JOIN board_columns bc ON bc.board_id = b.id
         JOIN tasks t ON t.column_id = bc.id AND t.assignee_id = $1
         GROUP BY b.id
         ORDER BY b.name, b.id`,
        [userId],
      ),
      pool.query<ProfileTaskRow>(
        `SELECT
           t.id,
           t.title,
           b.id AS board_id,
           b.name AS board_name,
           bc.id AS column_id,
           bc.title AS column_title,
           bc.workflow_status,
           ${taskStatusSql} AS status,
           t.priority,
           t.deadline
         FROM tasks t
         JOIN board_columns bc ON bc.id = t.column_id
         JOIN boards b ON b.id = bc.board_id
         WHERE t.assignee_id = $1
         ORDER BY t.deadline ASC NULLS LAST, t.created_at DESC`,
        [userId],
      ),
      pool.query<ProfileTaskRow>(
        `SELECT
           t.id,
           t.title,
           b.id AS board_id,
           b.name AS board_name,
           bc.id AS column_id,
           bc.title AS column_title,
           bc.workflow_status,
           ${taskStatusSql} AS status,
           t.priority,
           t.deadline,
           assignee.name AS assignee_name
         FROM tasks t
         JOIN board_columns bc ON bc.id = t.column_id
         JOIN boards b ON b.id = bc.board_id
         LEFT JOIN users assignee ON assignee.id = t.assignee_id
         WHERE t.created_by_id = $1
         ORDER BY t.created_at DESC`,
        [userId],
      ),
    ]);

  const stats = statsResult.rows[0];

  return res.json({
    profile: {
      username: user.name,
      email: user.email,
      createdAt: user.created_at.toISOString(),
    },
    stats: {
      totalTasks: stats.total_tasks,
      completed: stats.completed,
      inProgress: stats.in_progress,
      todo: stats.todo,
      overdue: stats.overdue,
    },
    boards: boardsResult.rows.map((board) => ({
      id: board.id,
      name: board.name,
      description: board.description,
      taskCount: board.task_count,
      completedCount: board.completed_count,
      completionPercent: Math.round(
        (board.completed_count / board.task_count) * 100,
      ),
    })),
    assignedTasks: assignedResult.rows.map(toProfileTask),
    createdTasks: createdResult.rows.map(toProfileTask),
  });
});

router.patch('/me/profile', async (req, res) => {
  const nameResult = profileNameSchema.safeParse(req.body?.name);

  if (!nameResult.success) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Username must be between 1 and 100 characters',
      },
    });
  }

  const userId = res.locals.userId as string;
  const result = await pool.query<{
    name: string;
    email: string;
    created_at: Date;
  }>(
    `UPDATE users
     SET name = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING name, email, created_at`,
    [userId, nameResult.data],
  );
  const user = result.rows[0];

  if (!user) {
    return res.status(404).json({
      error: { code: 'USER_NOT_FOUND', message: 'User not found' },
    });
  }

  return res.json({
    profile: {
      username: user.name,
      email: user.email,
      createdAt: user.created_at.toISOString(),
    },
  });
});

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
