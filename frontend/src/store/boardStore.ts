import {
  create,
} from 'zustand';

import {
  mockBoards,
} from '../services/boards';

import type {
  Board,
  BoardColumn,
} from '../types/board';

type CreateBoardData = {
  name: string;
  description: string;
};

type UpdateBoardData = {
  name: string;
  description: string;
};

type BoardStore = {
  boards: Board[];

  createBoard: (
    data: CreateBoardData,
  ) => Board;

  updateBoard: (
    boardId: string,
    data: UpdateBoardData,
  ) => void;

  deleteBoard: (
    boardId: string,
  ) => void;

  updateBoardColumns: (
    boardId: string,
    columns: BoardColumn[],
  ) => void;
};

export const useBoardStore =
  create<BoardStore>(
    (set) => ({
      boards: mockBoards,

      createBoard: (
        data,
      ) => {
        const newBoard: Board = {
          id: crypto.randomUUID(),
          name: data.name,
          description:
            data.description,
          tasksCount: 0,
          createdAt:
            new Date().toISOString(),
          columns: [
            {
              id: crypto.randomUUID(),
              title: 'To Do',
              tasks: [],
            },
            {
              id: crypto.randomUUID(),
              title: 'In Progress',
              tasks: [],
            },
            {
              id: crypto.randomUUID(),
              title: 'Done',
              tasks: [],
            },
          ],
        };

        set((state) => ({
          boards: [
            ...state.boards,
            newBoard,
          ],
        }));

        return newBoard;
      },

      updateBoard: (
        boardId,
        data,
      ) => {
        set((state) => ({
          boards: state.boards.map(
            (board) =>
              board.id === boardId
                ? {
                    ...board,
                    name: data.name,
                    description:
                      data.description,
                  }
                : board,
          ),
        }));
      },

      deleteBoard: (
        boardId,
      ) => {
        set((state) => ({
          boards:
            state.boards.filter(
              (board) =>
                board.id !== boardId,
            ),
        }));
      },

      updateBoardColumns: (
        boardId,
        columns,
      ) => {
        const tasksCount =
          columns.reduce(
            (
              total,
              column,
            ) =>
              total +
              column.tasks.length,
            0,
          );

        set((state) => ({
          boards: state.boards.map(
            (board) =>
              board.id === boardId
                ? {
                    ...board,
                    columns,
                    tasksCount,
                  }
                : board,
          ),
        }));
      },
    }),
  );