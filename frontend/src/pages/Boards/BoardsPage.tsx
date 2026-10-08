import {
  useState,
} from 'react';

import {
  Link,
} from 'react-router-dom';

import BoardForm from '../../features/boards/BoardForm';

import type {
  BoardFormValues,
} from '../../features/boards/boardSchema';

import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import BoardCard from '../../components/BoardCard/BoardCard';

import {
  useBoardStore,
} from '../../store/boardStore';

import type {
  Board,
} from '../../types/board';

import './BoardsPage.scss';

type ModalMode =
  | 'create'
  | 'edit'
  | null;

function BoardsPage() {
  const boards =
    useBoardStore(
      (state) => state.boards,
    );

  const createBoard =
    useBoardStore(
      (state) => state.createBoard,
    );

  const updateBoard =
    useBoardStore(
      (state) => state.updateBoard,
    );

  const deleteBoard =
    useBoardStore(
      (state) => state.deleteBoard,
    );

  const [
    modalMode,
    setModalMode,
  ] = useState<ModalMode>(
    null,
  );

  const [
    editingBoardId,
    setEditingBoardId,
  ] = useState<string | null>(
    null,
  );

  function openCreateModal() {
    setEditingBoardId(null);
    setModalMode('create');
  }

  function openEditModal(
    boardId: string,
  ) {
    setEditingBoardId(boardId);
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setEditingBoardId(null);
  }

  function handleCreateBoard(
    values: BoardFormValues,
  ) {
    createBoard(values);
    closeModal();
  }

  function handleUpdateBoard(
    values: BoardFormValues,
  ) {
    if (!editingBoardId) {
      return;
    }

    updateBoard(
      editingBoardId,
      values,
    );

    closeModal();
  }

  function handleDeleteBoard(
    board: Board,
  ) {
    const confirmed =
      window.confirm(
        `Delete board "${board.name}"?`,
      );

    if (!confirmed) {
      return;
    }

    deleteBoard(board.id);
  }

  const editingBoard =
    editingBoardId
      ? boards.find(
          (board) =>
            board.id ===
            editingBoardId,
        )
      : undefined;

  return (
    <div className="boards-page">
      <header className="boards-page__header">
        <div>
          <h1 className="boards-page__title">
            Boards
          </h1>

          <p className="boards-page__description">
            Manage your project boards
          </p>
        </div>

        <Button
          onClick={
            openCreateModal
          }
        >
          + Create Board
        </Button>
      </header>

      {boards.length === 0 ? (
        <div className="boards-page__empty">
          <h2>
            No boards yet
          </h2>

          <p>
            Create your first board
            to get started.
          </p>

          <Button
            onClick={
              openCreateModal
            }
          >
            Create Board
          </Button>
        </div>
      ) : (
        <div className="boards-page__grid">
          {boards.map(
            (board) => (
              <div
                key={board.id}
                className="boards-page__item"
              >
                <BoardCard
                  board={board}
                />

                <div className="boards-page__item-actions">
                  <Link
                    className="boards-page__open"
                    to={`/boards/${board.id}`}
                  >
                    Open board
                  </Link>

                  <Button
                    variant="secondary"
                    onClick={() =>
                      openEditModal(
                        board.id,
                      )
                    }
                  >
                    Edit
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() =>
                      handleDeleteBoard(
                        board,
                      )
                    }
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {modalMode ===
        'create' && (
        <Modal
          title="Create Board"
          onClose={
            closeModal
          }
        >
          <BoardForm
            defaultValues={{
              name: '',
              description: '',
            }}
            submitLabel="Create Board"
            onSubmit={
              handleCreateBoard
            }
            onCancel={
              closeModal
            }
          />
        </Modal>
      )}

      {modalMode ===
        'edit' &&
        editingBoard && (
          <Modal
            title="Edit Board"
            onClose={
              closeModal
            }
          >
            <BoardForm
              defaultValues={{
                name:
                  editingBoard.name,
                description:
                  editingBoard.description,
              }}
              submitLabel="Save Changes"
              onSubmit={
                handleUpdateBoard
              }
              onCancel={
                closeModal
              }
            />
          </Modal>
        )}
    </div>
  );
}

export default BoardsPage;