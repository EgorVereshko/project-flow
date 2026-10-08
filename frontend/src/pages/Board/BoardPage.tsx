import { Link, useParams } from 'react-router-dom';

import Button from '../../components/Button/Button';
import BoardColumn from '../../components/BoardColumn/BoardColumn';
import { mockBoards } from '../../services/boards';

import './BoardPage.scss';

function BoardPage() {
  const { boardId } = useParams();

  const board = mockBoards.find(
    (item) => item.id === boardId,
  );

  if (!board) {
    return (
      <div className="board-page board-page--not-found">
        <h1>Board not found</h1>

        <p>
          The board you are looking for does not exist.
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
          <Button variant="secondary">
            Edit Board
          </Button>

          <Button>
            + Add Task
          </Button>
        </div>
      </header>

      <section className="board-page__content">
        <div className="board-page__columns">
          {board.columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default BoardPage;