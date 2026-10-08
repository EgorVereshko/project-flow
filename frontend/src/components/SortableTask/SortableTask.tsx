import {
  useSortable,
} from '@dnd-kit/sortable';

import {
  CSS,
} from '@dnd-kit/utilities';

import type {
  Task,
} from '../../types/board';

import TaskCard from '../TaskCard/TaskCard';

import './SortableTask.scss';

type SortableTaskProps = {
  task: Task;
  onEdit: (
    taskId: string,
  ) => void;
};

function SortableTask({
  task,
  onEdit,
}: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform:
      CSS.Transform.toString(
        transform,
      ),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        isDragging
          ? 'sortable-task sortable-task--dragging'
          : 'sortable-task'
      }
      {...attributes}
      {...listeners}
    >
      <TaskCard
        task={task}
        onEdit={() =>
          onEdit(task.id)
        }
      />
    </div>
  );
}

export default SortableTask;