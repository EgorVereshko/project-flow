import { apiRequest } from './api';
import type { Board } from '../types/board';

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