import type {
  BoardColumn,
} from '../../types/board';

import {
  useCallback,
} from 'react';

import {
  Link,
  useParams,
} from 'react-router-dom';

import Button from '../../components/Button/Button';

import KanbanBoard from '../../components/KanbanBoard/KanbanBoard';

import {
  useBoardStore,
} from '../../store/boardStore';

import './BoardPage.scss';

function BoardPage() {
  const {
    boardId,
  } = useParams();

  const boards =
    useBoardStore(
      (state) => state.boards,
    );

  const updateBoard =
    useBoardStore(
      (state) => state.updateBoard,
    );

  const updateBoardColumns =
    useBoardStore(
      (state) =>
        state.updateBoardColumns,
    );

  const board =
    boards.find(
      (item) =>
        item.id === boardId,
    );

  const handleColumnsChange =
    useCallback(
      (
        columns: BoardColumn[],
      ) => {
        if (!boardId) {
          return;
        }

        updateBoardColumns(
          boardId,
          columns,
        );
      },
      [
        boardId,
        updateBoardColumns,
      ],
    );

  function handleEditBoard() {
    if (!board) {
      return;
    }

    const name =
      window.prompt(
        'Board name',
        board.name,
      );

    if (name === null) {
      return;
    }

    const trimmedName =
      name.trim();

    if (!trimmedName) {
      return;
    }

    const description =
      window.prompt(
        'Board description',
        board.description,
      );

    if (description === null) {
      return;
    }

    updateBoard(
      board.id,
      {
        name: trimmedName,
        description:
          description.trim(),
      },
    );
  }

  if (!board) {
    return (
      <div className="board-page board-page--not-found">
        <h1>
          Board not found
        </h1>

        <p>
          The board you are
          looking for does not
          exist.
        </p>

        <Link to="/boards">
          Back to boards
        </Link>
      </div>
    );
  }

  return (
    <div className="board-page">
      <header className="board-page__header">
        <div className="board-page__heading">
          <Link
            to="/boards"
            className="board-page__back"
          >
            ← Back to boards
          </Link>

          <h1 className="board-page__title">
            {board.name}
          </h1>

          <p className="board-page__description">
            {board.description}
          </p>
        </div>

        <div className="board-page__actions">
          <Button
            variant="secondary"
            onClick={
              handleEditBoard
            }
          >
            Edit Board
          </Button>
        </div>
      </header>

      <section className="board-page__content">
        <KanbanBoard
          initialColumns={
            board.columns
          }
          onColumnsChange={
            handleColumnsChange
          }
        />
      </section>
    </div>
  );
}

export default BoardPage;