import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import BoardForm from '../../features/boards/BoardForm';
import type { BoardFormValues } from '../../features/boards/boardSchema';

import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import BoardCard from '../../components/BoardCard/BoardCard';

import { useAuthStore } from '../../features/auth/authStore';
import {
  getBoards,
  createBoard,
  updateBoard,
  deleteBoard,
} from '../../services/boardsApi';

import type { Board } from '../../types/board';

import './BoardsPage.scss';

type ModalMode = 'create' | 'edit' | null;

const BOARDS_QUERY_KEY = ['boards'];

function BoardsPage() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: boards = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [...BOARDS_QUERY_KEY, accessToken],
    queryFn: () => getBoards(accessToken!),
    enabled: Boolean(accessToken),
  });

  const createMutation = useMutation({
    mutationFn: (values: BoardFormValues) =>
      createBoard(values, accessToken!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: BOARDS_QUERY_KEY });
      closeModal();
    },
    onError: () => {
      setActionError('Не удалось создать доску. Попробуйте ещё раз.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      boardId,
      values,
    }: {
      boardId: string;
      values: BoardFormValues;
    }) => updateBoard(boardId, values, accessToken!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: BOARDS_QUERY_KEY });
      closeModal();
    },
    onError: () => {
      setActionError('Не удалось сохранить изменения. Попробуйте ещё раз.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (boardId: string) => deleteBoard(boardId, accessToken!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: BOARDS_QUERY_KEY });
    },
    onError: () => {
      setActionError('Не удалось удалить доску. Попробуйте ещё раз.');
    },
  });

  function openCreateModal() {
    setActionError(null);
    setEditingBoardId(null);
    setModalMode('create');
  }

  function openEditModal(boardId: string) {
    setActionError(null);
    setEditingBoardId(boardId);
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setEditingBoardId(null);
    setActionError(null);
  }

  function handleCreateBoard(values: BoardFormValues) {
    setActionError(null);
    createMutation.mutate(values);
  }

  function handleUpdateBoard(values: BoardFormValues) {
    if (!editingBoardId) return;

    setActionError(null);
    updateMutation.mutate({ boardId: editingBoardId, values });
  }

  function handleDeleteBoard(board: Board) {
    const confirmed = window.confirm(
      `Delete board "${board.name}"?`,
    );

    if (!confirmed) return;

    setActionError(null);
    deleteMutation.mutate(board.id);
  }

  const editingBoard = editingBoardId
    ? boards.find((board) => board.id === editingBoardId)
    : undefined;

  if (!accessToken) {
    return (
      <div className="boards-page">
        <p>Сессия не найдена. Войди в аккаунт и попробуй снова.</p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="boards-page">
        <p>Загрузка досок...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="boards-page">
        <p>
          {error instanceof Error
            ? error.message
            : 'Не удалось загрузить доски.'}
        </p>
        <Button onClick={() => void refetch()}>
          Повторить
        </Button>
      </div>
    );
  }

  return (
    <div className="boards-page">
      <header className="boards-page__header">
        <div>
          <h1 className="boards-page__title">Boards</h1>
          <p className="boards-page__description">
            Manage your project boards
          </p>
        </div>

        <Button onClick={openCreateModal}>
          + Create Board
        </Button>
      </header>

      {actionError && (
        <p role="alert">{actionError}</p>
      )}

      {boards.length === 0 ? (
        <div className="boards-page__empty">
          <h2>No boards yet</h2>
          <p>Create your first board to get started.</p>
          <Button onClick={openCreateModal}>
            Create Board
          </Button>
        </div>
      ) : (
        <div className="boards-page__grid">
          {boards.map((board) => (
            <div
              key={board.id}
              className="boards-page__item"
            >
              <BoardCard board={board} />

              <div className="boards-page__item-actions">
                <Link
                  className="boards-page__open"
                  to={`/boards/${board.id}`}
                >
                  Open board
                </Link>

                <Button
                  variant="secondary"
                  onClick={() => openEditModal(board.id)}
                >
                  Edit
                </Button>

                <Button
                  variant="danger"
                  onClick={() => handleDeleteBoard(board)}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalMode === 'create' && (
        <Modal
          title="Create Board"
          onClose={closeModal}
        >
          <BoardForm
            defaultValues={{
              name: '',
              description: '',
            }}
            submitLabel="Create Board"
            onSubmit={handleCreateBoard}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modalMode === 'edit' && editingBoard && (
        <Modal
          title="Edit Board"
          onClose={closeModal}
        >
          <BoardForm
            defaultValues={{
              name: editingBoard.name,
              description: editingBoard.description,
            }}
            submitLabel="Save Changes"
            onSubmit={handleUpdateBoard}
            onCancel={closeModal}
          />
        </Modal>
      )}
    </div>
  );
}

export default BoardsPage;