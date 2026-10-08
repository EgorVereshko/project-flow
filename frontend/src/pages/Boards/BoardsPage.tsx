import { useState } from 'react';

import Button from '../../components/Button/Button';
import BoardCard from '../../components/BoardCard/BoardCard';
import { mockBoards } from '../../services/boards';

import './BoardsPage.scss';

function BoardsPage() {
  const [boards] = useState(mockBoards);

  return (
    <div className="boards-page">
      <header className="boards-page__header">
        <div>
          <h1 className="boards-page__title">
            Boards
          </h1>

          <p className="boards-page__subtitle">
            Manage your projects and tasks
          </p>
        </div>

        <Button>
          + New Board
        </Button>
      </header>

      <section className="boards-page__content">
        <div className="boards-page__section-header">
          <h2 className="boards-page__section-title">
            Your boards
          </h2>

          <span className="boards-page__count">
            {boards.length} boards
          </span>
        </div>

        {boards.length > 0 ? (
          <div className="boards-page__grid">
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
              />
            ))}
          </div>
        ) : (
          <div className="boards-page__empty">
            <h3>No boards yet</h3>

            <p>
              Create your first board to get started.
            </p>

            <Button>
              Create Board
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

export default BoardsPage;