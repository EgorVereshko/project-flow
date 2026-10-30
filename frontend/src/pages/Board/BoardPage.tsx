import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import Button from '../../components/Button/Button';
import KanbanBoard from '../../components/KanbanBoard/KanbanBoard';

import { useAuthStore } from '../../features/auth/authStore';
import { getBoard, updateBoard } from '../../services/boardsApi';

import './BoardPage.scss';

function BoardPage() {
  const { boardId } = useParams();
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const [editError, setEditError] = useState<string | null>(null);

  const {
    data: board,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['board', boardId, accessToken],
    queryFn: () => getBoard(boardId!, accessToken!),
    enabled: Boolean(boardId && accessToken),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      updateBoard(boardId!, data, accessToken!),
    onSuccess: async (updatedBoard) => {
      queryClient.setQueryData(
        ['board', boardId, accessToken],
        updatedBoard,
      );

      await queryClient.invalidateQueries({
        queryKey: ['boards'],
      });

      setEditError(null);
    },
    onError: () => {
      setEditError('Не удалось сохранить доску. Попробуйте ещё раз.');
    },
  });

  function handleEditBoard() {
    if (!board) return;

    const name = window.prompt('Board name', board.name);
    if (name === null) return;

    const trimmedName = name.trim();
    if (!trimmedName) return;

    const description = window.prompt(
      'Board description',
      board.description,
    );
    if (description === null) return;

    updateMutation.mutate({
      name: trimmedName,
      description: description.trim(),
    });
  }

  if (!accessToken) {
    return (
      <div className="board-page">
        <p>Сессия не найдена. Войди в аккаунт и попробуй снова.</p>
        <Link to="/boards">Back to boards</Link>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="board-page">
        <p>Loading board...</p>
      </div>
    );
  }

  if (isError || !board) {
    return (
      <div className="board-page board-page--not-found">
        <h1>Board not found</h1>
        <p>The board could not be loaded.</p>
        <Button onClick={() => void refetch()}>
          Try again
        </Button>
        {' '}
        <Link to="/boards">Back to boards</Link>
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
            onClick={handleEditBoard}
            disabled={updateMutation.isPending}
          >
            Edit Board
          </Button>
        </div>
      </header>

      {editError && <p role="alert">{editError}</p>}

      <section className="board-page__content">
      <KanbanBoard
        key={board.id}
        boardId={boardId!}
        initialColumns={board.columns}
      />
      </section>
    </div>
  );
}

export default BoardPage;