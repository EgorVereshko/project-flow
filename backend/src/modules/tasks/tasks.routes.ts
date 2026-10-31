
import { Router } from 'express';
import { pool } from '../../config/db.js';
import { isUuid, validateUuidParam } from '../../middleware/validateUuid.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.param('taskId', validateUuidParam('Task ID'));

function isDateOnly(value: unknown): value is string {
  if (
    typeof value !== 'string'
    || !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime())
    && date.toISOString().slice(0, 10) === value;
}

function getUserId(res: Parameters<typeof authenticate>[1]): string {
  return res.locals.userId as string;
}

async function getBoardIdForColumn(
  columnId: string,
  userId: string,
): Promise<string | null> {
  const result = await pool.query<{ board_id: string }>(
    `SELECT bc.board_id
     FROM board_columns bc
     JOIN board_members bm ON bm.board_id = bc.board_id
     WHERE bc.id = $1 AND bm.user_id = $2`,
    [columnId, userId],
  );

  return result.rows[0]?.board_id ?? null;
}

async function getBoardMemberName(
  boardId: string,
  memberId: string,
): Promise<string | null> {
  const result = await pool.query<{ name: string }>(
    `SELECT u.name
     FROM board_members bm
     JOIN users u ON u.id = bm.user_id
     WHERE bm.board_id = $1 AND bm.user_id = $2`,
    [boardId, memberId],
  );

  return result.rows[0]?.name ?? null;
}

// Создание задачи
router.post('/', async (req, res) => {
  const columnId =
    typeof req.body?.columnId === 'string' ? req.body.columnId : '';
  const title =
    typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const description =
    typeof req.body?.description === 'string'
      ? req.body.description.trim()
      : '';
  const hasDescription = req.body?.description !== undefined;
  const assigneeId = req.body?.assigneeId ?? null;
  const deadlineInput = req.body?.deadline ?? null;

  if (
    !columnId ||
    !isUuid(columnId) ||
    !title ||
    title.length > 200 ||
    (hasDescription && typeof req.body.description !== 'string') ||
    description.length > 10_000 ||
    (assigneeId !== null && !isUuid(assigneeId)) ||
    (deadlineInput !== null && !isDateOnly(deadlineInput))
  ) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Provide a valid column ID, title and description',
      },
    });
  }

  const userId = getUserId(res);
  const boardId = await getBoardIdForColumn(columnId, userId);

  if (!boardId) {
    return res.status(404).json({
      error: {
        code: 'COLUMN_NOT_FOUND',
        message: 'Column not found',
      },
    });
  }

  const assigneeName = assigneeId
    ? await getBoardMemberName(boardId, assigneeId)
    : null;

  if (assigneeId && !assigneeName) {
    return res.status(400).json({
      error: {
        code: 'INVALID_ASSIGNEE',
        message: 'Assignee must be a member of this board',
      },
    });
  }

  const result = await pool.query<{
    id: string;
    column_id: string;
    title: string;
    description: string;
    assignee_id: string | null;
    deadline: Date | null;
  }>(
    `INSERT INTO tasks (
       column_id, title, description, position, created_by_id,
       assignee_id, deadline
     )
     VALUES (
       $1, $2, $3,
       (SELECT COUNT(*)::int FROM tasks WHERE column_id = $1),
       $4, $5, $6
     )
     RETURNING id, column_id, title, description, assignee_id, deadline`,
    [
      columnId,
      title,
      description,
      userId,
      assigneeId,
      deadlineInput ? new Date(`${deadlineInput}T00:00:00.000Z`) : null,
    ],
  );

  const task = result.rows[0];

  return res.status(201).json({
    task: {
      id: task.id,
      columnId: task.column_id,
      title: task.title,
      description: task.description,
      assigneeId: task.assignee_id,
      assignee: assigneeName ?? '',
      deadline: task.deadline?.toISOString().slice(0, 10) ?? null,
    },
  });
});

// Редактирование задачи
router.patch('/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const userId = getUserId(res);

  const title =
    typeof req.body?.title === 'string' ? req.body.title.trim() : undefined;
  const description =
    typeof req.body?.description === 'string'
      ? req.body.description.trim()
      : undefined;
  const hasTitle = req.body?.title !== undefined;
  const hasDescription = req.body?.description !== undefined;
  const hasAssigneeId = Object.hasOwn(req.body ?? {}, 'assigneeId');
  const assigneeId = hasAssigneeId ? req.body.assigneeId : undefined;
  const hasDeadline = Object.hasOwn(req.body ?? {}, 'deadline');
  const deadlineInput = hasDeadline ? req.body.deadline : undefined;

  if (
    (
      title === undefined
      && description === undefined
      && !hasAssigneeId
      && !hasDeadline
    ) ||
    (hasTitle && typeof req.body.title !== 'string') ||
    (
      hasDescription
      && typeof req.body.description !== 'string'
    ) ||
    (title !== undefined && (!title || title.length > 200)) ||
    (description !== undefined && description.length > 10_000) ||
    (
      hasAssigneeId
      && assigneeId !== null
      && !isUuid(assigneeId)
    ) ||
    (
      hasDeadline
      && deadlineInput !== null
      && !isDateOnly(deadlineInput)
    )
  ) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Provide valid task fields',
      },
    });
  }

  const access = await pool.query<{ board_id: string }>(
    `SELECT bc.board_id
     FROM tasks t
     JOIN board_columns bc ON bc.id = t.column_id
     JOIN board_members bm ON bm.board_id = bc.board_id
     WHERE t.id = $1 AND bm.user_id = $2`,
    [taskId, userId],
  );

  if (!access.rowCount) {
    return res.status(404).json({
      error: { code: 'TASK_NOT_FOUND', message: 'Task not found' },
    });
  }

  const boardId = access.rows[0].board_id;
  let assigneeName: string | null | undefined;

  if (hasAssigneeId && assigneeId) {
    assigneeName = await getBoardMemberName(boardId, assigneeId);

    if (!assigneeName) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ASSIGNEE',
          message: 'Assignee must be a member of this board',
        },
      });
    }
  }

  const result = await pool.query<{
    id: string;
    column_id: string;
    title: string;
    description: string;
    assignee_id: string | null;
    deadline: Date | null;
  }>(
    `UPDATE tasks
     SET title = COALESCE($2, title),
         description = COALESCE($3, description),
         assignee_id = CASE WHEN $4 THEN $5::uuid ELSE assignee_id END,
         deadline = CASE WHEN $6 THEN $7::timestamptz ELSE deadline END,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, column_id, title, description, assignee_id, deadline`,
    [
      taskId,
      title ?? null,
      description ?? null,
      hasAssigneeId,
      assigneeId ?? null,
      hasDeadline,
      deadlineInput
        ? new Date(`${deadlineInput}T00:00:00.000Z`)
        : null,
    ],
  );

  const task = result.rows[0];
  if (assigneeName === undefined && task.assignee_id) {
    assigneeName = await getBoardMemberName(boardId, task.assignee_id);
  }

  return res.json({
    task: {
      id: task.id,
      columnId: task.column_id,
      title: task.title,
      description: task.description,
      assigneeId: task.assignee_id,
      assignee: assigneeName ?? '',
      deadline: task.deadline?.toISOString().slice(0, 10) ?? null,
    },
  });
});

// Удаление задачи
router.delete('/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const userId = getUserId(res);

  const result = await pool.query(
    `DELETE FROM tasks t
     USING board_columns bc, board_members bm
     WHERE t.id = $1
       AND bc.id = t.column_id
       AND bm.board_id = bc.board_id
       AND bm.user_id = $2
     RETURNING t.id`,
    [taskId, userId],
  );

  if (!result.rowCount) {
    return res.status(404).json({
      error: { code: 'TASK_NOT_FOUND', message: 'Task not found' },
    });
  }

  return res.status(204).send();
});

// Перемещение задачи и изменение порядка
router.patch('/:taskId/move', async (req, res) => {
  const { taskId } = req.params;
  const columnId =
    typeof req.body?.columnId === 'string' ? req.body.columnId : '';
  const position = req.body?.position;
  const userId = getUserId(res);

  if (
    !isUuid(columnId) ||
    !Number.isInteger(position) ||
    position < 0
  ) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Provide a valid column ID and position',
      },
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const taskResult = await client.query<{
      column_id: string;
      board_id: string;
    }>(
      `SELECT t.column_id, bc.board_id
       FROM tasks t
       JOIN board_columns bc ON bc.id = t.column_id
       JOIN board_members bm ON bm.board_id = bc.board_id
       WHERE t.id = $1 AND bm.user_id = $2
       FOR UPDATE OF t`,
      [taskId, userId],
    );

    if (!taskResult.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: { code: 'TASK_NOT_FOUND', message: 'Task not found' },
      });
    }

    const destinationResult = await client.query<{ board_id: string }>(
      `SELECT bc.board_id
       FROM board_columns bc
       JOIN board_members bm ON bm.board_id = bc.board_id
       WHERE bc.id = $1 AND bm.user_id = $2`,
      [columnId, userId],
    );

    if (
      !destinationResult.rowCount ||
      destinationResult.rows[0].board_id !== taskResult.rows[0].board_id
    ) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: {
          code: 'INVALID_DESTINATION',
          message: 'Destination column must belong to the same board',
        },
      });
    }

    const sourceColumnId = taskResult.rows[0].column_id;

    await client.query(
      `UPDATE tasks SET column_id = $2, position = $3, updated_at = NOW()
       WHERE id = $1`,
      [taskId, columnId, position],
    );

    // Пересчитываем позиции в исходной колонке.
    if (sourceColumnId !== columnId) {
      await client.query(
        `WITH ordered AS (
           SELECT id, ROW_NUMBER() OVER (
             ORDER BY position, created_at, id
           ) - 1 AS new_position
           FROM tasks
           WHERE column_id = $1
         )
         UPDATE tasks t
         SET position = ordered.new_position
         FROM ordered
         WHERE t.id = ordered.id`,
        [sourceColumnId],
      );
    }

    // Нормализуем порядок задач в целевой колонке.
    await client.query(
      `WITH ordered AS (
         SELECT id, ROW_NUMBER() OVER (
           ORDER BY
             CASE WHEN id = $2 THEN $3 ELSE position END,
             created_at, id
         ) - 1 AS new_position
         FROM tasks
         WHERE column_id = $1
       )
       UPDATE tasks t
       SET position = ordered.new_position,
           updated_at = CASE WHEN t.id = $2 THEN NOW() ELSE t.updated_at END
       FROM ordered
       WHERE t.id = ordered.id`,
      [columnId, taskId, position],
    );

    await client.query('COMMIT');

    return res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

export default router;