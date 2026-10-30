import {
  useDroppable,
} from '@dnd-kit/core';

import {
  useState,
} from 'react';

import type {
  BoardColumn as BoardColumnType,
} from '../../types/board';

import Button from '../Button/Button';
import SortableTask from '../SortableTask/SortableTask';

import './BoardColumn.scss';

type BoardColumnProps = {
  column: BoardColumnType;
  onAddTask: () => void;
  onEditTask: (
    taskId: string,
  ) => void;
  onEditColumn: (
    columnId: string,
  ) => void;
  onDeleteColumn: (
    columnId: string,
  ) => void;
  onMoveColumn: (
    columnId: string,
    direction: 'left' | 'right',
  ) => void;
  columnIndex: number;
  columnCount: number;
  isSaving: boolean;
};

function BoardColumn({
  column,
  onAddTask,
  onEditTask,
  onEditColumn,
  onDeleteColumn,
  onMoveColumn,
  columnIndex,
  columnCount,
  isSaving,
}: BoardColumnProps) {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: column.id,
  });

  const [
    isMenuOpen,
    setIsMenuOpen,
  ] = useState(false);

  function handleMenuToggle(
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    event.stopPropagation();

    setIsMenuOpen(
      (current) => !current,
    );
  }

  function handleEditColumn() {
    setIsMenuOpen(false);

    onEditColumn(column.id);
  }

  function handleDeleteColumn() {
    setIsMenuOpen(false);

    onDeleteColumn(column.id);
  }

  function handleMoveColumn(direction: 'left' | 'right') {
    setIsMenuOpen(false);
    onMoveColumn(column.id, direction);
  }

  return (
    <section
      ref={setNodeRef}
      className={
        isOver
          ? 'board-column board-column--over'
          : 'board-column'
      }
    >
      <header className="board-column__header">
        <div className="board-column__title-wrapper">
          <h2 className="board-column__title">
            {column.title}
          </h2>

          <span className="board-column__count">
            {column.tasks.length}
          </span>
        </div>

        <div className="board-column__actions">
          <Button
            variant="secondary"
            onClick={onAddTask}
            disabled={isSaving}
          >
            +
          </Button>

          <div className="board-column__menu-wrapper">
            <button
              className="board-column__menu-button"
              type="button"
              aria-label={`Actions for ${column.title}`}
              disabled={isSaving}
              onClick={
                handleMenuToggle
              }
            >
              ⋯
            </button>

            {isMenuOpen && (
              <div className="board-column__menu">
                <button
                  type="button"
                  className="board-column__menu-item"
                  disabled={isSaving || columnIndex === 0}
                  onClick={() => handleMoveColumn('left')}
                >
                  Move left
                </button>

                <button
                  type="button"
                  className="board-column__menu-item"
                  disabled={isSaving || columnIndex === columnCount - 1}
                  onClick={() => handleMoveColumn('right')}
                >
                  Move right
                </button>

                <button
                  type="button"
                  className="board-column__menu-item"
                  disabled={isSaving}
                  onClick={
                    handleEditColumn
                  }
                >
                  Rename column
                </button>

                <button
                  type="button"
                  className="board-column__menu-item board-column__menu-item--danger"
                  disabled={isSaving}
                  onClick={
                    handleDeleteColumn
                  }
                >
                  Delete column
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="board-column__tasks">
        {column.tasks.length === 0 ? (
          <div className="board-column__empty">
            No tasks yet
          </div>
        ) : (
          column.tasks.map(
            (task) => (
              <SortableTask
                key={task.id}
                task={task}
                onEdit={onEditTask}
              />
            ),
          )
        )}
      </div>
    </section>
  );
}

export default BoardColumn;