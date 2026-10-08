import type { Task } from '../../types/board';

import './TaskCard.scss';

type TaskCardProps = {
  task: Task;
  onEdit?: () => void;
};

function TaskCard({
  task,
  onEdit,
}: TaskCardProps) {
  function handleEditClick(
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    event.stopPropagation();
    onEdit?.();
  }

  function handleEditPointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
  ) {
    event.stopPropagation();
  }

  return (
    <article className="task-card">
      <div className="task-card__header">
        <h3 className="task-card__title">
          {task.title}
        </h3>

        {onEdit && (
          <button
            className="task-card__menu"
            type="button"
            aria-label={`Edit ${task.title}`}
            onPointerDown={
              handleEditPointerDown
            }
            onClick={handleEditClick}
          >
            ⋯
          </button>
        )}
      </div>

      <div className="task-card__content">
        <p className="task-card__description">
          {task.description}
        </p>
      </div>

      <div className="task-card__footer">
        <span className="task-card__assignee">
          {task.assignee}
        </span>

        {task.deadline && (
          <span className="task-card__deadline">
            {task.deadline}
          </span>
        )}
      </div>
    </article>
  );
}

export default TaskCard;