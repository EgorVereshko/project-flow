import type { Task } from '../../types/board';

import './TaskCard.scss';

type TaskCardProps = {
  task: Task;
};

function TaskCard({ task }: TaskCardProps) {
  return (
    <article className="task-card">
      <div className="task-card__content">
        <h3 className="task-card__title">
          {task.title}
        </h3>

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