import { Link } from 'react-router-dom';

import type { Board } from '../../types/board';

import './BoardCard.scss';

type BoardCardProps = {
  board: Board;
};

function BoardCard({ board }: BoardCardProps) {
  return (
    <Link
      to={`/boards/${board.id}`}
      className="board-card"
    >
      <div className="board-card__content">
        <h3 className="board-card__title">
          {board.name}
        </h3>

        <p className="board-card__description">
          {board.description}
        </p>
      </div>

      <div className="board-card__footer">
        <span className="board-card__tasks">
          {board.tasksCount} tasks
        </span>

        <span className="board-card__arrow">
          →
        </span>
      </div>
    </Link>
  );
}

export default BoardCard;