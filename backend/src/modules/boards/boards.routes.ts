
import { Router } from 'express';

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

type TaskRow = {
  id: string;
  column_id: string;
  title: string;
  description: string;
  position: number;
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
        assignee: task.assignee_name ?? '',
        deadline: task.deadline?.toISOString() ?? null,
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

router.post('/', async (req, res) => {
  const name = typeof req.body?.name === 'string'
    ? req.body.name.trim()
    : '';
  const description = typeof req.body?.description === 'string'
    ? req.body.description.trim()
    : '';

  if (!name || name.length > 150 || description.length > 10_000) {
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
  const description = typeof req.body?.description === 'string'
    ? req.body.description.trim()
    : '';

  if (!name || name.length > 150 || description.length > 10_000) {
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

export default router;