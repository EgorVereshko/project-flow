import { apiRequest } from './api';
import type { Board, BoardMember } from '../types/board';

type BoardFormData = {
  name: string;
  description: string;
};

type BoardsResponse = {
  boards: Board[];
};

type BoardResponse = {
  board: Board;
};

export type BoardColumnRecord = {
  id: string;
  title: string;
  position: number;
};

type ColumnResponse = {
  column: BoardColumnRecord;
};

type ColumnsResponse = {
  columns: BoardColumnRecord[];
};

type BoardMembersResponse = {
  members: BoardMember[];
};

// Получить все доски пользователя
export async function getBoards(
  accessToken: string,
): Promise<Board[]> {
  const response = await apiRequest<BoardsResponse>(
    '/api/boards',
    { method: 'GET' },
    accessToken,
  );

  return response.boards;
}

// Получить одну доску
export async function getBoard(
  boardId: string,
  accessToken: string,
): Promise<Board> {
  const response = await apiRequest<BoardResponse>(
    `/api/boards/${boardId}`,
    { method: 'GET' },
    accessToken,
  );

  return response.board;
}

export async function getBoardMembers(
  boardId: string,
  accessToken: string,
): Promise<BoardMember[]> {
  const response = await apiRequest<BoardMembersResponse>(
    `/api/boards/${boardId}/members`,
    { method: 'GET' },
    accessToken,
  );

  return response.members;
}

// Создать доску
export async function createBoard(
  data: BoardFormData,
  accessToken: string,
): Promise<Board> {
  const response = await apiRequest<BoardResponse>(
    '/api/boards',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    accessToken,
  );

  return response.board;
}

// Обновить доску
export async function updateBoard(
  boardId: string,
  data: BoardFormData,
  accessToken: string,
): Promise<Board> {
  const response = await apiRequest<BoardResponse>(
    `/api/boards/${boardId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
    accessToken,
  );

  return response.board;
}

// Удалить доску
export async function deleteBoard(
  boardId: string,
  accessToken: string,
): Promise<void> {
  await apiRequest<void>(
    `/api/boards/${boardId}`,
    { method: 'DELETE' },
    accessToken,
  );
}

export async function createBoardColumn(
  boardId: string,
  title: string,
  accessToken: string,
): Promise<BoardColumnRecord> {
  const response = await apiRequest<ColumnResponse>(
    `/api/boards/${boardId}/columns`,
    {
      method: 'POST',
      body: JSON.stringify({ title }),
    },
    accessToken,
  );

  return response.column;
}

export async function updateBoardColumn(
  boardId: string,
  columnId: string,
  title: string,
  accessToken: string,
): Promise<BoardColumnRecord> {
  const response = await apiRequest<ColumnResponse>(
    `/api/boards/${boardId}/columns/${columnId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    },
    accessToken,
  );

  return response.column;
}

export async function deleteBoardColumn(
  boardId: string,
  columnId: string,
  accessToken: string,
): Promise<BoardColumnRecord[]> {
  const response = await apiRequest<ColumnsResponse>(
    `/api/boards/${boardId}/columns/${columnId}`,
    { method: 'DELETE' },
    accessToken,
  );

  return response.columns;
}

export async function reorderBoardColumns(
  boardId: string,
  columnIds: string[],
  accessToken: string,
): Promise<BoardColumnRecord[]> {
  const response = await apiRequest<ColumnsResponse>(
    `/api/boards/${boardId}/columns/order`,
    {
      method: 'PATCH',
      body: JSON.stringify({ columnIds }),
    },
    accessToken,
  );

  return response.columns;
}