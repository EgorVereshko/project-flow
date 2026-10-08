import Button from '../Button/Button';
import TaskCard from '../TaskCard/TaskCard';

import type { BoardColumn as BoardColumnType } from '../../types/board';

import './BoardColumn.scss';

type BoardColumnProps = {
  column: BoardColumnType;
};

function BoardColumn({ column }: BoardColumnProps) {
  return (
    <section className="board-column">
      <header className="board-column__header">
        <div className="board-column__title-wrapper">
          <h2 className="board-column__title">
            {column.title}
          </h2>

          <span className="board-column__count">
            {column.tasks.length}
          </span>
        </div>

        <Button>
          +
        </Button>
      </header>

      <div className="board-column__tasks">
        {column.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
          />
        ))}

        {column.tasks.length === 0 && (
          <div className="board-column__empty">
            No tasks
          </div>
        )}
      </div>
    </section>
  );
}

export default BoardColumn;