
import { Router } from 'express';
import type { PoolClient } from 'pg';

import { pool } from '../../config/db.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = Router();

type BoardRow = {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: Date;
};

type ColumnRow = {
  id: string;
  board_id: string;
  title: string;
  position: number;
};

type ApiColumn = {
  id: string;
  title: string;
  position: number;
};

type TaskRow = {
  id: string;
  column_id: string;
  title: string;
  description: string;
  position: number;
  assignee_id: string | null;
  deadline: Date | null;
  assignee_name: string | null;
};

type ApiBoard = {
  id: string;
  name: string;
  description: string;
  tasksCount: number;
  createdAt: string;
  columns: {
    id: string;
    title: string;
    tasks: {
      id: string;
      title: string;
      description: string;
      assigneeId: string | null;
      assignee: string;
      deadline: string | null;
    }[];
  }[];
};

async function loadBoards(
  userId: string,
  boardId?: string,
): Promise<ApiBoard[]> {
  const values: string[] = [userId];
  let boardFilter = '';

  if (boardId) {
    values.push(boardId);
    boardFilter = 'AND b.id = $2';
  }

  const boardResult = await pool.query<BoardRow>(
    `SELECT b.id, b.name, b.description, b.owner_id, b.created_at
     FROM boards b
     JOIN board_members bm ON bm.board_id = b.id
     WHERE bm.user_id = $1 ${boardFilter}
     ORDER BY b.created_at DESC`,
    values,
  );

  const boards = boardResult.rows;

  if (boards.length === 0) {
    return [];
  }

  const boardIds = boards.map((board) => board.id);

  const columnResult = await pool.query<ColumnRow>(
    `SELECT id, board_id, title, position
     FROM board_columns
     WHERE board_id = ANY($1::uuid[])
     ORDER BY position ASC`,
    [boardIds],
  );

  const taskResult = await pool.query<TaskRow>(
    `SELECT
       t.id,
       t.column_id,
       t.title,
       t.description,
       t.position,
       t.assignee_id,
       t.deadline,
       u.name AS assignee_name
     FROM tasks t
     JOIN board_columns bc ON bc.id = t.column_id
     LEFT JOIN users u ON u.id = t.assignee_id
     WHERE bc.board_id = ANY($1::uuid[])
     ORDER BY t.position ASC`,
    [boardIds],
  );

  const tasksByColumn = new Map<string, TaskRow[]>();

  for (const task of taskResult.rows) {
    const tasks = tasksByColumn.get(task.column_id) ?? [];
    tasks.push(task);
    tasksByColumn.set(task.column_id, tasks);
  }

  const columnsByBoard = new Map<string, ApiBoard['columns']>();

  for (const column of columnResult.rows) {
    const columns = columnsByBoard.get(column.board_id) ?? [];

    columns.push({
      id: column.id,
      title: column.title,
      tasks: (tasksByColumn.get(column.id) ?? []).map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        assigneeId: task.assignee_id,
        assignee: task.assignee_name ?? '',
        deadline: task.deadline?.toISOString().slice(0, 10) ?? null,
      })),
    });

    columnsByBoard.set(column.board_id, columns);
  }

  return boards.map((board) => {
    const columns = columnsByBoard.get(board.id) ?? [];

    return {
      id: board.id,
      name: board.name,
      description: board.description,
      tasksCount: columns.reduce(
        (total, column) => total + column.tasks.length,
        0,
      ),
      createdAt: board.created_at.toISOString(),
      columns,
    };
  });
}

function getUserId(res: Parameters<typeof authenticate>[1]): string {
  return res.locals.userId as string;
}

function validationError(res: Parameters<typeof authenticate>[1]) {
  return res.status(400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Provide a valid board name and description',
    },
  });
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function lockBoardForMember(
  client: PoolClient,
  boardId: string,
  userId: string,
): Promise<boolean> {
  const result = await client.query(
    `SELECT b.id
     FROM boards b
     JOIN board_members bm ON bm.board_id = b.id
     WHERE b.id = $1 AND bm.user_id = $2
     FOR UPDATE OF b`,
    [boardId, userId],
  );

  return result.rowCount !== null && result.rowCount > 0;
}

async function normalizeColumnPositions(
  client: PoolClient,
  boardId: string,
  orderedIds?: string[],
): Promise<ApiColumn[]> {
  const result = await client.query<ApiColumn>(
    `SELECT id, title, position
     FROM board_columns
     WHERE board_id = $1
     ORDER BY position ASC
     FOR UPDATE`,
    [boardId],
  );
  const columns = result.rows;
  const ids = orderedIds ?? columns.map((column) => column.id);
  const offset =
    Math.max(-1, ...columns.map((column) => column.position))
    + columns.length
    + 1;

  if (columns.length > 0) {
    await client.query(
      `UPDATE board_columns
       SET position = position + $2
       WHERE board_id = $1`,
      [boardId, offset],
    );

    await client.query(
      `UPDATE board_columns AS bc
       SET position = ordered.ordinality - 1,
           updated_at = NOW()
       FROM UNNEST($2::uuid[]) WITH ORDINALITY AS ordered(id, ordinality)
       WHERE bc.id = ordered.id AND bc.board_id = $1`,
      [boardId, ids],
    );
  }

  const normalized = await client.query<ApiColumn>(
    `SELECT id, title, position
     FROM board_columns
     WHERE board_id = $1
     ORDER BY position ASC`,
    [boardId],
  );

  return normalized.rows;
}

router.use(authenticate);

router.get('/', async (_req, res) => {
  const boards = await loadBoards(getUserId(res));

  return res.json({ boards });
});

router.get('/:boardId', async (req, res) => {
  const boards = await loadBoards(getUserId(res), req.params.boardId);
  const board = boards[0];

  if (!board) {
    return res.status(404).json({
      error: {
        code: 'BOARD_NOT_FOUND',
        message: 'Board not found',
      },
    });
  }

  return res.json({ board });
});

router.get('/:boardId/members', async (req, res) => {
  if (!isUuid(req.params.boardId)) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Provide a valid board ID' },
    });
  }

  const result = await pool.query<{
    id: string;
    name: string;
    email: string;
  }>(
    `SELECT u.id, u.name, u.email
     FROM board_members bm
     JOIN users u ON u.id = bm.user_id
     WHERE bm.board_id = $1 AND EXISTS (
       SELECT 1
       FROM board_members current_member
       WHERE current_member.board_id = bm.board_id
         AND current_member.user_id = $2
     )
     ORDER BY u.name, u.email`,
    [req.params.boardId, getUserId(res)],
  );

  if (result.rowCount === 0) {
    return res.status(404).json({
      error: { code: 'BOARD_NOT_FOUND', message: 'Board not found' },
    });
  }

  return res.json({ members: result.rows });
});

router.post('/', async (req, res) => {
  const name = typeof req.body?.name === 'string'
    ? req.body.name.trim()
    : '';
  const hasDescription = req.body?.description !== undefined;
  const description = typeof req.body?.description === 'string'
    ? req.body.description.trim()
    : '';

  if (
    !name
    || name.length > 150
    || (hasDescription && typeof req.body.description !== 'string')
    || description.length > 10_000
  ) {
    return validationError(res);
  }

  const userId = getUserId(res);
  const client = await pool.connect();

  let boardId: string;

  try {
    await client.query('BEGIN');

    const result = await client.query<{ id: string }>(
      `INSERT INTO boards (name, description, owner_id)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [name, description, userId],
    );

    boardId = result.rows[0].id;

    await client.query(
      `INSERT INTO board_members (board_id, user_id, role)
       VALUES ($1, $2, 'OWNER')`,
      [boardId, userId],
    );

    await client.query(
      `INSERT INTO board_columns (board_id, title, position)
       VALUES
         ($1, 'To Do', 0),
         ($1, 'In Progress', 1),
         ($1, 'Done', 2)`,
      [boardId],
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }

  const boards = await loadBoards(userId, boardId);

  return res.status(201).json({ board: boards[0] });
});

router.patch('/:boardId', async (req, res) => {
  const name = typeof req.body?.name === 'string'
    ? req.body.name.trim()
    : '';
  const hasDescription = req.body?.description !== undefined;
  const description = typeof req.body?.description === 'string'
    ? req.body.description.trim()
    : '';

  if (
    !name
    || name.length > 150
    || (hasDescription && typeof req.body.description !== 'string')
    || description.length > 10_000
  ) {
    return validationError(res);
  }

  const result = await pool.query<{ id: string }>(
    `UPDATE boards
     SET name = $1, description = $2, updated_at = NOW()
     WHERE id = $3 AND owner_id = $4
     RETURNING id`,
    [name, description, req.params.boardId, getUserId(res)],
  );

  if (!result.rows[0]) {
    return res.status(404).json({
      error: {
        code: 'BOARD_NOT_FOUND',
        message: 'Board not found or you do not have permission to edit it',
      },
    });
  }

  const boards = await loadBoards(getUserId(res), req.params.boardId);

  return res.json({ board: boards[0] });
});

router.delete('/:boardId', async (req, res) => {
  const result = await pool.query<{ id: string }>(
    `DELETE FROM boards
     WHERE id = $1 AND owner_id = $2
     RETURNING id`,
    [req.params.boardId, getUserId(res)],
  );

  if (!result.rows[0]) {
    return res.status(404).json({
      error: {
        code: 'BOARD_NOT_FOUND',
        message: 'Board not found or you do not have permission to delete it',
      },
    });
  }

  return res.status(204).end();
});

router.post('/:boardId/columns', async (req, res) => {
  const { boardId } = req.params;
  const title =
    typeof req.body?.title === 'string' ? req.body.title.trim() : '';

  if (!isUuid(boardId) || !title || title.length > 100) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Provide a valid board ID and column title',
      },
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (!(await lockBoardForMember(client, boardId, getUserId(res)))) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: { code: 'BOARD_NOT_FOUND', message: 'Board not found' },
      });
    }

    const result = await client.query<ApiColumn>(
      `INSERT INTO board_columns (board_id, title, position)
       SELECT $1, $2, (COALESCE(MAX(position), -1) + 1)::int
       FROM board_columns
       WHERE board_id = $1
       RETURNING id, title, position`,
      [boardId, title],
    );

    await client.query('COMMIT');
    return res.status(201).json({ column: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
});

router.patch('/:boardId/columns/order', async (req, res) => {
  const { boardId } = req.params;
  const { columnIds } = req.body ?? {};

  if (
    !isUuid(boardId)
    || !Array.isArray(columnIds)
    || columnIds.length === 0
    || !columnIds.every(isUuid)
    || new Set(columnIds).size !== columnIds.length
  ) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Provide the ordered IDs of all board columns',
      },
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (!(await lockBoardForMember(client, boardId, getUserId(res)))) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: { code: 'BOARD_NOT_FOUND', message: 'Board not found' },
      });
    }

    const currentColumns = await client.query<{ id: string }>(
      `SELECT id
       FROM board_columns
       WHERE board_id = $1
       FOR UPDATE`,
      [boardId],
    );

    const currentIds = new Set(
      currentColumns.rows.map((column) => column.id),
    );

    if (
      currentIds.size !== columnIds.length
      || columnIds.some((columnId: string) => !currentIds.has(columnId))
    ) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: {
          code: 'INVALID_COLUMN_ORDER',
          message: 'Column IDs must match the columns on this board',
        },
      });
    }

    const columns = await normalizeColumnPositions(
      client,
      boardId,
      columnIds,
    );

    await client.query('COMMIT');
    return res.json({ columns });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
});

router.patch('/:boardId/columns/:columnId', async (req, res) => {
  const { boardId, columnId } = req.params;
  const title =
    typeof req.body?.title === 'string' ? req.body.title.trim() : '';

  if (
    !isUuid(boardId)
    || !isUuid(columnId)
    || !title
    || title.length > 100
  ) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Provide a valid column title',
      },
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (!(await lockBoardForMember(client, boardId, getUserId(res)))) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: { code: 'BOARD_NOT_FOUND', message: 'Board not found' },
      });
    }

    const result = await client.query<ApiColumn>(
      `UPDATE board_columns
       SET title = $3, updated_at = NOW()
       WHERE board_id = $1 AND id = $2
       RETURNING id, title, position`,
      [boardId, columnId, title],
    );

    if (!result.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: { code: 'COLUMN_NOT_FOUND', message: 'Column not found' },
      });
    }

    await client.query('COMMIT');
    return res.json({ column: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
});

router.delete('/:boardId/columns/:columnId', async (req, res) => {
  const { boardId, columnId } = req.params;

  if (!isUuid(boardId) || !isUuid(columnId)) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Provide valid board and column IDs',
      },
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (!(await lockBoardForMember(client, boardId, getUserId(res)))) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: { code: 'BOARD_NOT_FOUND', message: 'Board not found' },
      });
    }

    const columnResult = await client.query<{ id: string }>(
      `SELECT id
       FROM board_columns
       WHERE board_id = $1 AND id = $2
       FOR UPDATE`,
      [boardId, columnId],
    );

    if (!columnResult.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: { code: 'COLUMN_NOT_FOUND', message: 'Column not found' },
      });
    }

    const countResult = await client.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count
       FROM board_columns
       WHERE board_id = $1`,
      [boardId],
    );

    if (countResult.rows[0].count <= 1) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: {
          code: 'LAST_COLUMN',
          message: 'A board must have at least one column',
        },
      });
    }

    await client.query(
      'DELETE FROM board_columns WHERE board_id = $1 AND id = $2',
      [boardId, columnId],
    );
    const columns = await normalizeColumnPositions(client, boardId);

    await client.query('COMMIT');
    return res.json({ columns });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
});

export default router;