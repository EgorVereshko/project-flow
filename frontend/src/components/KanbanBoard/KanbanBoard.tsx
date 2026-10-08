import {
  closestCorners,
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';

import {
  arrayMove,
} from '@dnd-kit/sortable';

import {
  useState,
} from 'react';

import BoardColumn from '../BoardColumn/BoardColumn';
import Button from '../Button/Button';
import Modal from '../Modal/Modal';
import TaskCard from '../TaskCard/TaskCard';

import ColumnForm from '../../features/columns/ColumnForm';

import type {
  ColumnFormValues,
} from '../../features/columns/columnSchema';

import TaskForm from '../../features/tasks/TaskForm';

import type {
  TaskFormValues,
} from '../../features/tasks/taskSchema';

import {
  addColumn,
  addTaskToColumn,
  deleteColumn,
  deleteTask,
  findColumnById,
  findColumnByTaskId,
  findTaskById,
  moveTaskBetweenColumns,
  updateColumn,
  updateTask,
} from '../../lib/boardUtils';

import type {
  BoardColumn as BoardColumnType,
  Task,
} from '../../types/board';

import './KanbanBoard.scss';

type KanbanBoardProps = {
  initialColumns: BoardColumnType[];
};

type ModalMode =
  | 'create-task'
  | 'edit-task'
  | 'create-column'
  | 'edit-column'
  | null;

function KanbanBoard({
  initialColumns,
}: KanbanBoardProps) {
  const [
    columns,
    setColumns,
  ] = useState(initialColumns);

  const [
    activeTaskId,
    setActiveTaskId,
  ] = useState<string | null>(
    null,
  );

  const [
    modalMode,
    setModalMode,
  ] = useState<ModalMode>(
    null,
  );

  const [
    editingTaskId,
    setEditingTaskId,
  ] = useState<string | null>(
    null,
  );

  const [
    createColumnId,
    setCreateColumnId,
  ] = useState<string | null>(
    null,
  );

  const [
    editingColumnId,
    setEditingColumnId,
  ] = useState<string | null>(
    null,
  );

  function handleDragStart(
    event: DragStartEvent,
  ) {
    setActiveTaskId(
      String(event.active.id),
    );
  }

  function handleDragOver(
    event: DragOverEvent,
  ) {
    const {
      active,
      over,
    } = event;

    if (!over) {
      return;
    }

    const activeId =
      String(active.id);

    const overId =
      String(over.id);

    setColumns(
      (currentColumns) => {
        const sourceColumn =
          findColumnByTaskId(
            currentColumns,
            activeId,
          );

        const targetColumn =
          findColumnById(
            currentColumns,
            overId,
          ) ??
          findColumnByTaskId(
            currentColumns,
            overId,
          );

        if (
          !sourceColumn ||
          !targetColumn
        ) {
          return currentColumns;
        }

        if (
          sourceColumn.id ===
          targetColumn.id
        ) {
          return currentColumns;
        }

        const targetIndex =
          targetColumn.tasks.findIndex(
            (task) =>
              task.id === overId,
          );

        return moveTaskBetweenColumns(
          currentColumns,
          activeId,
          sourceColumn.id,
          targetColumn.id,
          targetIndex >= 0
            ? targetIndex
            : undefined,
        );
      },
    );
  }

  function handleDragEnd(
    event: DragEndEvent,
  ) {
    const {
      active,
      over,
    } = event;

    setActiveTaskId(null);

    if (!over) {
      return;
    }

    const activeId =
      String(active.id);

    const overId =
      String(over.id);

    setColumns(
      (currentColumns) => {
        const activeColumn =
          findColumnByTaskId(
            currentColumns,
            activeId,
          );

        const overColumn =
          findColumnById(
            currentColumns,
            overId,
          ) ??
          findColumnByTaskId(
            currentColumns,
            overId,
          );

        if (
          !activeColumn ||
          !overColumn
        ) {
          return currentColumns;
        }

        if (
          activeColumn.id !==
          overColumn.id
        ) {
          return currentColumns;
        }

        const oldIndex =
          activeColumn.tasks.findIndex(
            (task) =>
              task.id === activeId,
          );

        const newIndex =
          overColumn.tasks.findIndex(
            (task) =>
              task.id === overId,
          );

        if (
          oldIndex === -1 ||
          newIndex === -1 ||
          oldIndex === newIndex
        ) {
          return currentColumns;
        }

        return currentColumns.map(
          (column) => {
            if (
              column.id !==
              activeColumn.id
            ) {
              return column;
            }

            return {
              ...column,
              tasks: arrayMove(
                column.tasks,
                oldIndex,
                newIndex,
              ),
            };
          },
        );
      },
    );
  }

  function handleDragCancel() {
    setActiveTaskId(null);
  }

  function openCreateTaskModal(
    columnId: string,
  ) {
    setCreateColumnId(columnId);
    setEditingTaskId(null);
    setModalMode(
      'create-task',
    );
  }

  function openEditTaskModal(
    taskId: string,
  ) {
    setEditingTaskId(taskId);
    setCreateColumnId(null);
    setModalMode(
      'edit-task',
    );
  }

  function openCreateColumnModal() {
    setEditingColumnId(null);
    setModalMode(
      'create-column',
    );
  }

  function openEditColumnModal(
    columnId: string,
  ) {
    setEditingColumnId(columnId);
    setModalMode(
      'edit-column',
    );
  }

  function closeModal() {
    setModalMode(null);
    setEditingTaskId(null);
    setCreateColumnId(null);
    setEditingColumnId(null);
  }

  function handleCreateTask(
    values: TaskFormValues,
  ) {
    if (!createColumnId) {
      return;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: values.title,
      description:
        values.description,
      assignee: values.assignee,
      deadline: values.deadline,
    };

    setColumns(
      (currentColumns) =>
        addTaskToColumn(
          currentColumns,
          createColumnId,
          newTask,
        ),
    );

    closeModal();
  }

  function handleUpdateTask(
    values: TaskFormValues,
  ) {
    if (!editingTaskId) {
      return;
    }

    const currentTask =
      findTaskById(
        columns,
        editingTaskId,
      );

    if (!currentTask) {
      return;
    }

    const updatedTask: Task = {
      ...currentTask,
      title: values.title,
      description:
        values.description,
      assignee: values.assignee,
      deadline: values.deadline,
    };

    setColumns(
      (currentColumns) =>
        updateTask(
          currentColumns,
          editingTaskId,
          updatedTask,
        ),
    );

    closeModal();
  }

  function handleDeleteTask(
    taskId: string,
  ) {
    const confirmed =
      window.confirm(
        'Are you sure you want to delete this task?',
      );

    if (!confirmed) {
      return;
    }

    setColumns(
      (currentColumns) =>
        deleteTask(
          currentColumns,
          taskId,
        ),
    );

    closeModal();
  }

  function handleCreateColumn(
    values: ColumnFormValues,
  ) {
    const newColumn: BoardColumnType = {
      id: crypto.randomUUID(),
      title: values.title,
      tasks: [],
    };

    setColumns(
      (currentColumns) =>
        addColumn(
          currentColumns,
          newColumn,
        ),
    );

    closeModal();
  }

  function handleUpdateColumn(
    values: ColumnFormValues,
  ) {
    if (!editingColumnId) {
      return;
    }

    setColumns(
      (currentColumns) =>
        updateColumn(
          currentColumns,
          editingColumnId,
          values.title,
        ),
    );

    closeModal();
  }

  function handleDeleteColumn(
    columnId: string,
  ) {
    if (columns.length <= 1) {
      window.alert(
        'A board must have at least one column.',
      );

      return;
    }

    const column =
      findColumnById(
        columns,
        columnId,
      );

    if (!column) {
      return;
    }

    const hasTasks =
      column.tasks.length > 0;

    const message = hasTasks
      ? `Column "${column.title}" contains ${column.tasks.length} task(s). Delete it anyway?`
      : `Delete column "${column.title}"?`;

    const confirmed =
      window.confirm(message);

    if (!confirmed) {
      return;
    }

    setColumns(
      (currentColumns) =>
        deleteColumn(
          currentColumns,
          columnId,
        ),
    );
  }

  const activeTask =
    activeTaskId
      ? findTaskById(
          columns,
          activeTaskId,
        )
      : undefined;

  const editingTask =
    editingTaskId
      ? findTaskById(
          columns,
          editingTaskId,
        )
      : undefined;

  const createColumn =
    createColumnId
      ? findColumnById(
          columns,
          createColumnId,
        )
      : undefined;

  const editingColumn =
    editingColumnId
      ? findColumnById(
          columns,
          editingColumnId,
        )
      : undefined;

  return (
    <>
      <div className="kanban-board__toolbar">
        <Button
          variant="secondary"
          onClick={
            openCreateColumnModal
          }
        >
          + Add Column
        </Button>
      </div>

      <DndContext
        collisionDetection={
          closestCorners
        }
        onDragStart={
          handleDragStart
        }
        onDragOver={
          handleDragOver
        }
        onDragEnd={
          handleDragEnd
        }
        onDragCancel={
          handleDragCancel
        }
      >
        <div className="kanban-board">
          {columns.map(
            (column) => (
              <BoardColumn
                key={column.id}
                column={column}
                onAddTask={() =>
                  openCreateTaskModal(
                    column.id,
                  )
                }
                onEditTask={
                  openEditTaskModal
                }
                onEditColumn={
                  openEditColumnModal
                }
                onDeleteColumn={
                  handleDeleteColumn
                }
              />
            ),
          )}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="kanban-board__overlay">
              <TaskCard
                task={activeTask}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {modalMode ===
        'create-task' &&
        createColumn && (
          <Modal
            title={`Add task to ${createColumn.title}`}
            onClose={
              closeModal
            }
          >
            <TaskForm
              defaultValues={{
                title: '',
                description: '',
                assignee: '',
                deadline: null,
              }}
              submitLabel="Create Task"
              onSubmit={
                handleCreateTask
              }
              onCancel={
                closeModal
              }
            />
          </Modal>
        )}

      {modalMode ===
        'edit-task' &&
        editingTask && (
          <Modal
            title="Edit Task"
            onClose={
              closeModal
            }
          >
            <TaskForm
              defaultValues={{
                title:
                  editingTask.title,
                description:
                  editingTask.description,
                assignee:
                  editingTask.assignee,
                deadline:
                  editingTask.deadline,
              }}
              submitLabel="Save Changes"
              onSubmit={
                handleUpdateTask
              }
              onCancel={
                closeModal
              }
            />

            <div className="kanban-board__delete">
              <Button
                variant="danger"
                onClick={() =>
                  handleDeleteTask(
                    editingTask.id,
                  )
                }
              >
                Delete Task
              </Button>
            </div>
          </Modal>
        )}

      {modalMode ===
        'create-column' && (
          <Modal
            title="Create Column"
            onClose={
              closeModal
            }
          >
            <ColumnForm
              defaultValues={{
                title: '',
              }}
              submitLabel="Create Column"
              onSubmit={
                handleCreateColumn
              }
              onCancel={
                closeModal
              }
            />
          </Modal>
        )}

      {modalMode ===
        'edit-column' &&
        editingColumn && (
          <Modal
            title="Rename Column"
            onClose={
              closeModal
            }
          >
            <ColumnForm
              defaultValues={{
                title:
                  editingColumn.title,
              }}
              submitLabel="Save Changes"
              onSubmit={
                handleUpdateColumn
              }
              onCancel={
                closeModal
              }
            />
          </Modal>
        )}
    </>
  );
}

export default KanbanBoard;