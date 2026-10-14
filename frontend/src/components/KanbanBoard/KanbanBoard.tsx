
import {
  closestCorners,
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import BoardColumn from '../BoardColumn/BoardColumn';
import Button from '../Button/Button';
import Modal from '../Modal/Modal';
import TaskCard from '../TaskCard/TaskCard';

import ColumnForm from '../../features/columns/ColumnForm';
import type { ColumnFormValues } from '../../features/columns/columnSchema';

import TaskForm from '../../features/tasks/TaskForm';
import type { TaskFormValues } from '../../features/tasks/taskSchema';

import { useAuthStore } from '../../features/auth/authStore';

import {
  createTask,
  updateTask as updateTaskApi,
  deleteTask as deleteTaskApi,
  moveTask as moveTaskApi,
} from '../../services/tasksApi';

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

type ModalMode =
  | 'create-task'
  | 'edit-task'
  | 'create-column'
  | 'edit-column'
  | null;

type KanbanBoardProps = {
  initialColumns: BoardColumnType[];
  onColumnsChange?: (columns: BoardColumnType[]) => void;
};

function KanbanBoard({
  initialColumns,
  onColumnsChange,
}: KanbanBoardProps) {
  const accessToken = useAuthStore((state) => state.accessToken);

  const [columns, setColumns] = useState(initialColumns);
  const columnsRef = useRef(initialColumns);

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [createColumnId, setCreateColumnId] = useState<string | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [isSavingTask, setIsSavingTask] = useState(false);

  // Сохраняем актуальное состояние для отката при ошибке API.
  function applyColumns(next: BoardColumnType[]) {
    columnsRef.current = next;
    setColumns(next);
  }

  useEffect(() => {
    columnsRef.current = initialColumns;
    setColumns(initialColumns);
  }, [initialColumns]);

  useEffect(() => {
    onColumnsChange?.(columns);
  }, [columns, onColumnsChange]);

  const createTaskMutation = useMutation({
    mutationFn: (data: {
      columnId: string;
      title: string;
      description: string;
    }) => {
      if (!accessToken) {
        throw new Error('Сессия не найдена. Войди в аккаунт ещё раз.');
      }
      return createTask(data, accessToken);
    },
  });

  function handleDragStart(event: DragStartEvent) {
    setActiveTaskId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const currentColumns = columnsRef.current;
    const sourceColumn = findColumnByTaskId(currentColumns, activeId);
    const targetColumn =
      findColumnById(currentColumns, overId) ??
      findColumnByTaskId(currentColumns, overId);

    if (!sourceColumn || !targetColumn) return;
    if (sourceColumn.id === targetColumn.id) return;

    const targetIndex = targetColumn.tasks.findIndex(
      (task) => task.id === overId,
    );

    applyColumns(
      moveTaskBetweenColumns(
        currentColumns,
        activeId,
        sourceColumn.id,
        targetColumn.id,
        targetIndex >= 0 ? targetIndex : undefined,
      ),
    );
  }

  
async function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  setActiveTaskId(null);

  if (!over || !accessToken) return;

  const activeId = String(active.id);
  const overId = String(over.id);
  const currentColumns = columnsRef.current;

  // После handleDragOver задача уже может находиться
  // в колонке назначения.
  const activeColumn = findColumnByTaskId(currentColumns, activeId);

  if (!activeColumn) return;

  const overTaskColumn = findColumnByTaskId(currentColumns, overId);
  const overColumn = findColumnById(currentColumns, overId);
  const targetColumn = overColumn ?? overTaskColumn;

  let nextColumns = currentColumns;

  // Меняем порядок только при отпускании над другой задачей.
  // Если overId — ID колонки, newIndex будет -1,
  // но это не должно прерывать сохранение перемещения.
  if (
    overTaskColumn &&
    overTaskColumn.id === activeColumn.id &&
    overId !== activeId
  ) {
    const oldIndex = activeColumn.tasks.findIndex(
      (task) => task.id === activeId,
    );

    const newIndex = activeColumn.tasks.findIndex(
      (task) => task.id === overId,
    );

    if (
      oldIndex >= 0 &&
      newIndex >= 0 &&
      oldIndex !== newIndex
    ) {
      nextColumns = currentColumns.map((column) =>
        column.id === activeColumn.id
          ? {
              ...column,
              tasks: arrayMove(column.tasks, oldIndex, newIndex),
            }
          : column,
      );

      applyColumns(nextColumns);
    }
  }

  // Определяем конечную колонку по фактическому
  // расположению задачи после drag-and-drop.
  const destinationColumn = findColumnByTaskId(
    columnsRef.current,
    activeId,
  );

  if (!destinationColumn) return;

  const newPosition = destinationColumn.tasks.findIndex(
    (task) => task.id === activeId,
  );

  if (newPosition < 0) return;

  try {
    await moveTaskApi(
      activeId,
      {
        columnId: destinationColumn.id,
        position: newPosition,
      },
      accessToken,
    );
  } catch (error) {
    console.error('Failed to move task:', error);

    setTaskError(
      'Не удалось сохранить перемещение задачи. Попробуй ещё раз.',
    );
  }
}

  function handleDragCancel() {
    setActiveTaskId(null);
  }

  function openCreateTaskModal(columnId: string) {
    setCreateColumnId(columnId);
    setEditingTaskId(null);
    setTaskError(null);
    setModalMode('create-task');
  }

  function openEditTaskModal(taskId: string) {
    setEditingTaskId(taskId);
    setCreateColumnId(null);
    setTaskError(null);
    setModalMode('edit-task');
  }

  function openCreateColumnModal() {
    setEditingColumnId(null);
    setModalMode('create-column');
  }

  function openEditColumnModal(columnId: string) {
    setEditingColumnId(columnId);
    setModalMode('edit-column');
  }

  function closeModal() {
    setModalMode(null);
    setEditingTaskId(null);
    setCreateColumnId(null);
    setEditingColumnId(null);
    setTaskError(null);
  }

  async function handleCreateTask(values: TaskFormValues) {
    if (!createColumnId || !accessToken) {
      setTaskError('Сессия не найдена. Войди в аккаунт ещё раз.');
      return;
    }

    setTaskError(null);
    setIsSavingTask(true);

    try {
      const newTask = await createTaskMutation.mutateAsync({
        columnId: createColumnId,
        title: values.title,
        description: values.description,
      });

      applyColumns(
        addTaskToColumn(columnsRef.current, createColumnId, newTask),
      );
      closeModal();
    } catch {
      setTaskError('Не удалось создать задачу. Попробуй ещё раз.');
    } finally {
      setIsSavingTask(false);
    }
  }

  async function handleUpdateTask(values: TaskFormValues) {
    if (!editingTaskId || !accessToken) {
      setTaskError('Сессия не найдена. Войди в аккаунт ещё раз.');
      return;
    }

    const previousColumns = columnsRef.current;
    const currentTask = findTaskById(previousColumns, editingTaskId);

    if (!currentTask) return;

    setTaskError(null);
    setIsSavingTask(true);

    try {
      const savedTask = await updateTaskApi(
        editingTaskId,
        {
          title: values.title,
          description: values.description,
        },
        accessToken,
      );

      const updatedTask: Task = {
        ...currentTask,
        ...savedTask,
        title: savedTask.title,
        description: savedTask.description,
      };

      applyColumns(
        updateTask(columnsRef.current, editingTaskId, updatedTask),
      );
      closeModal();
    } catch {
      setTaskError('Не удалось сохранить задачу. Проверь подключение.');
    } finally {
      setIsSavingTask(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    const confirmed = window.confirm(
      'Вы уверены, что хотите удалить эту задачу?',
    );

    if (!confirmed) return;

    if (!accessToken) {
      setTaskError('Сессия не найдена. Войди в аккаунт ещё раз.');
      return;
    }

    const previousColumns = columnsRef.current;
    setTaskError(null);
    setIsSavingTask(true);

    try {
      await deleteTaskApi(taskId, accessToken);
      applyColumns(deleteTask(columnsRef.current, taskId));
      closeModal();
    } catch {
      applyColumns(previousColumns);
      setTaskError('Не удалось удалить задачу. Попробуй ещё раз.');
    } finally {
      setIsSavingTask(false);
    }
  }

  function handleCreateColumn(values: ColumnFormValues) {
    const newColumn: BoardColumnType = {
      id: crypto.randomUUID(),
      title: values.title,
      tasks: [],
    };

    applyColumns(addColumn(columnsRef.current, newColumn));
    closeModal();
  }

  function handleUpdateColumn(values: ColumnFormValues) {
    if (!editingColumnId) return;

    applyColumns(
      updateColumn(columnsRef.current, editingColumnId, values.title),
    );
    closeModal();
  }

  function handleDeleteColumn(columnId: string) {
    if (columnsRef.current.length <= 1) {
      window.alert('На доске должна остаться хотя бы одна колонка.');
      return;
    }

    const column = findColumnById(columnsRef.current, columnId);
    if (!column) return;

    const message = column.tasks.length
      ? `В колонке «${column.title}» ${column.tasks.length} задач(и). Удалить её?`
      : `Удалить колонку «${column.title}»?`;

    if (!window.confirm(message)) return;

    applyColumns(deleteColumn(columnsRef.current, columnId));
  }

  const activeTask = activeTaskId
    ? findTaskById(columns, activeTaskId)
    : undefined;

  const editingTask = editingTaskId
    ? findTaskById(columns, editingTaskId)
    : undefined;

  const createColumn = createColumnId
    ? findColumnById(columns, createColumnId)
    : undefined;

  const editingColumn = editingColumnId
    ? findColumnById(columns, editingColumnId)
    : undefined;

  return (
    <>
      <div className="kanban-board__toolbar">
        <Button variant="secondary" onClick={openCreateColumnModal}>
          + Add Column
        </Button>
      </div>

      {taskError && (
        <p role="alert" className="task-form__error">
          {taskError}
        </p>
      )}

      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="kanban-board">
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              onAddTask={() => openCreateTaskModal(column.id)}
              onEditTask={openEditTaskModal}
              onEditColumn={openEditColumnModal}
              onDeleteColumn={handleDeleteColumn}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="kanban-board__overlay">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {modalMode === 'create-task' && createColumn && (
        <Modal
          title={`Add task to ${createColumn.title}`}
          onClose={closeModal}
        >
          <TaskForm
            defaultValues={{
              title: '',
              description: '',
              assignee: '',
              deadline: null,
            }}
            submitLabel={isSavingTask ? 'Creating...' : 'Create Task'}
            onSubmit={handleCreateTask}
            onCancel={closeModal}
            isSubmitting={isSavingTask}
          />
        </Modal>
      )}

      {modalMode === 'edit-task' && editingTask && (
        <Modal title="Edit Task" onClose={closeModal}>
          {taskError && (
            <p role="alert" className="task-form__error">
              {taskError}
            </p>
          )}

          <TaskForm
            defaultValues={{
              title: editingTask.title,
              description: editingTask.description,
              assignee: editingTask.assignee,
              deadline: editingTask.deadline,
            }}
            submitLabel={isSavingTask ? 'Saving...' : 'Save Changes'}
            onSubmit={handleUpdateTask}
            onCancel={closeModal}
            isSubmitting={isSavingTask}
          />

          <div className="kanban-board__delete">
            <Button
              variant="danger"
              onClick={() => void handleDeleteTask(editingTask.id)}
              disabled={isSavingTask}
            >
              {isSavingTask ? 'Please wait...' : 'Delete Task'}
            </Button>
          </div>
        </Modal>
      )}

      {modalMode === 'create-column' && (
        <Modal title="Create Column" onClose={closeModal}>
          <ColumnForm
            defaultValues={{ title: '' }}
            submitLabel="Create Column"
            onSubmit={handleCreateColumn}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modalMode === 'edit-column' && editingColumn && (
        <Modal title="Rename Column" onClose={closeModal}>
          <ColumnForm
            defaultValues={{ title: editingColumn.title }}
            submitLabel="Save Changes"
            onSubmit={handleUpdateColumn}
            onCancel={closeModal}
          />
        </Modal>
      )}
    </>
  );
}

export default KanbanBoard;