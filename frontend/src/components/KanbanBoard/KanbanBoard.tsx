
import {
  closestCorners,
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useRef, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

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
  createBoardColumn,
  deleteBoardColumn,
  getBoardMembers,
  reorderBoardColumns,
  updateBoardColumn,
} from '../../services/boardsApi';

import {
  addTaskToColumn,
  deleteTask,
  findColumnById,
  findColumnByTaskId,
  findTaskById,
  moveTaskBetweenColumns,
  updateTask,
} from '../../lib/boardUtils';

import type {
  BoardColumn as BoardColumnType,
  Board,
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
  boardId: string;
  initialColumns: BoardColumnType[];
};

type MoveTaskVariables = {
  taskId: string;
  columnId: string;
  position: number;
  previousColumns: BoardColumnType[];
  optimisticColumns: BoardColumnType[];
};

function KanbanBoard({
  boardId,
  initialColumns,
}: KanbanBoardProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const boardQueryKey = ['board', boardId, accessToken] as const;
  const boardMembersQuery = useQuery({
    queryKey: ['board-members', boardId, accessToken],
    queryFn: () => getBoardMembers(boardId, accessToken!),
    enabled: Boolean(boardId && accessToken),
  });

  const [columns, setColumns] = useState(initialColumns);
  const columnsRef = useRef(initialColumns);
  const dragSnapshotRef = useRef<BoardColumnType[] | null>(null);
  const activeDragTaskIdRef = useRef<string | null>(null);
  const movePendingRef = useRef(false);

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [createColumnId, setCreateColumnId] = useState<string | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [isSavingColumn, setIsSavingColumn] = useState(false);
  const [isSavingMove, setIsSavingMove] = useState(false);

  function applyColumns(
    next: BoardColumnType[],
    updateCache = true,
  ) {
    columnsRef.current = next;
    setColumns(next);
    if (updateCache) {
      queryClient.setQueryData<Board>(
        boardQueryKey,
        (board) => board
          ? {
              ...board,
              columns: next,
              tasksCount: next.reduce(
                (total, column) => total + column.tasks.length,
                0,
              ),
            }
          : board,
      );
    }
  }

  const moveTaskMutation = useMutation({
    mutationFn: ({
      taskId,
      columnId,
      position,
    }: MoveTaskVariables) => {
      if (!accessToken) {
        throw new Error('Сессия не найдена. Войди в аккаунт ещё раз.');
      }

      return moveTaskApi(taskId, { columnId, position }, accessToken);
    },
    onMutate: async ({ previousColumns, optimisticColumns }) => {
      await queryClient.cancelQueries({ queryKey: boardQueryKey });

      const previousBoard = queryClient.getQueryData<Board>(boardQueryKey);
      if (previousBoard) {
        queryClient.setQueryData<Board>(boardQueryKey, {
          ...previousBoard,
          columns: optimisticColumns,
        });
      }

      columnsRef.current = optimisticColumns;
      setColumns(optimisticColumns);

      return { previousBoard, previousColumns };
    },
    onError: (_error, variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(boardQueryKey, context.previousBoard);
      }

      const restoredColumns =
        context?.previousColumns
        ?? variables.previousColumns
        ?? dragSnapshotRef.current
        ?? columnsRef.current;
      columnsRef.current = restoredColumns;
      setColumns(restoredColumns);
      setTaskError(
        'Не удалось сохранить перемещение задачи. Порядок восстановлен; попробуй ещё раз.',
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: boardQueryKey,
        exact: true,
      });

      const savedBoard = queryClient.getQueryData<Board>(boardQueryKey);
      if (savedBoard) {
        columnsRef.current = savedBoard.columns;
        setColumns(savedBoard.columns);
      }
    },
    onSettled: () => {
      movePendingRef.current = false;
      dragSnapshotRef.current = null;
      setIsSavingMove(false);
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: {
      columnId: string;
      title: string;
      description: string;
      assigneeId: string | null;
      deadline: string | null;
    }) => {
      if (!accessToken) {
        throw new Error('Сессия не найдена. Войди в аккаунт ещё раз.');
      }
      return createTask(data, accessToken);
    },
  });

  const createColumnMutation = useMutation({
    mutationFn: (title: string) => {
      if (!accessToken) {
        throw new Error('Сессия не найдена. Войди в аккаунт ещё раз.');
      }
      return createBoardColumn(boardId, title, accessToken);
    },
    onSuccess: (column) => {
      applyColumns([
        ...columnsRef.current,
        { id: column.id, title: column.title, tasks: [] },
      ]);
    },
  });

  const updateColumnMutation = useMutation({
    mutationFn: ({
      columnId,
      title,
    }: {
      columnId: string;
      title: string;
    }) => {
      if (!accessToken) {
        throw new Error('Сессия не найдена. Войди в аккаунт ещё раз.');
      }
      return updateBoardColumn(boardId, columnId, title, accessToken);
    },
    onSuccess: (updatedColumn) => {
      applyColumns(
        columnsRef.current.map((column) =>
          column.id === updatedColumn.id
            ? { ...column, title: updatedColumn.title }
            : column,
        ),
      );
    },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: (columnId: string) => {
      if (!accessToken) {
        throw new Error('Сессия не найдена. Войди в аккаунт ещё раз.');
      }
      return deleteBoardColumn(boardId, columnId, accessToken);
    },
    onSuccess: (savedColumns) => {
      const currentColumns = new Map(
        columnsRef.current.map((column) => [column.id, column]),
      );
      applyColumns(
        savedColumns.flatMap((column) => {
          const current = currentColumns.get(column.id);
          return current
            ? [{ ...current, title: column.title }]
            : [];
        }),
      );
      void queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });

  const reorderColumnsMutation = useMutation({
    mutationFn: (columnIds: string[]) => {
      if (!accessToken) {
        throw new Error('Сессия не найдена. Войди в аккаунт ещё раз.');
      }
      return reorderBoardColumns(boardId, columnIds, accessToken);
    },
    onSuccess: (savedColumns) => {
      const currentColumns = new Map(
        columnsRef.current.map((column) => [column.id, column]),
      );
      applyColumns(
        savedColumns.flatMap((column) => {
          const current = currentColumns.get(column.id);
          return current
            ? [{ ...current, title: column.title }]
            : [];
        }),
      );
    },
  });

  function handleDragStart(event: DragStartEvent) {
    if (
      movePendingRef.current
      || isSavingTask
      || isSavingColumn
      || modalMode !== null
    ) {
      return;
    }

    const snapshot = columnsRef.current.map((column) => ({
      ...column,
      tasks: [...column.tasks],
    }));
    dragSnapshotRef.current = snapshot;
    activeDragTaskIdRef.current = String(event.active.id);
    setActiveTaskId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (
      !over
      || movePendingRef.current
      || activeDragTaskIdRef.current !== String(active.id)
    ) {
      return;
    }

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
      false,
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeId = String(active.id);
    const snapshot = dragSnapshotRef.current;
    const isCurrentDrag = activeDragTaskIdRef.current === activeId;

    setActiveTaskId(null);
    activeDragTaskIdRef.current = null;

    if (!isCurrentDrag || !snapshot) return;

    if (!over || !accessToken) {
      columnsRef.current = snapshot;
      setColumns(snapshot);
      dragSnapshotRef.current = null;
      return;
    }

    const overId = String(over.id);
    const currentColumns = columnsRef.current;
    const activeColumn = findColumnByTaskId(currentColumns, activeId);

    if (!activeColumn) {
      columnsRef.current = snapshot;
      setColumns(snapshot);
      dragSnapshotRef.current = null;
      return;
    }

    const overTaskColumn = findColumnByTaskId(currentColumns, overId);

    if (
      overTaskColumn
      && overTaskColumn.id === activeColumn.id
      && overId !== activeId
    ) {
      const oldIndex = activeColumn.tasks.findIndex(
        (task) => task.id === activeId,
      );
      const newIndex = activeColumn.tasks.findIndex(
        (task) => task.id === overId,
      );

      if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
        applyColumns(
          currentColumns.map((column) =>
            column.id === activeColumn.id
              ? {
                  ...column,
                  tasks: arrayMove(column.tasks, oldIndex, newIndex),
                }
              : column,
          ),
          false,
        );
      }
    }

    const destinationColumn = findColumnByTaskId(
      columnsRef.current,
      activeId,
    );
    const newPosition = destinationColumn?.tasks.findIndex(
      (task) => task.id === activeId,
    ) ?? -1;

    if (!destinationColumn || newPosition < 0) {
      columnsRef.current = snapshot;
      setColumns(snapshot);
      dragSnapshotRef.current = null;
      return;
    }

    const originalColumn = findColumnByTaskId(snapshot, activeId);
    const originalPosition = originalColumn?.tasks.findIndex(
      (task) => task.id === activeId,
    ) ?? -1;

    if (
      originalColumn?.id === destinationColumn.id
      && originalPosition === newPosition
    ) {
      dragSnapshotRef.current = null;
      return;
    }

    movePendingRef.current = true;
    setIsSavingMove(true);
    setTaskError(null);

    try {
      await moveTaskMutation.mutateAsync({
        taskId: activeId,
        columnId: destinationColumn.id,
        position: newPosition,
        previousColumns: snapshot,
        optimisticColumns: columnsRef.current.map((column) => ({
          ...column,
          tasks: [...column.tasks],
        })),
      });
    } catch {
      // The mutation's onError restores the snapshot and reports the failure.
    }
  }

  function handleDragCancel() {
    setActiveTaskId(null);
    activeDragTaskIdRef.current = null;

    const snapshot = dragSnapshotRef.current;
    if (snapshot) {
      columnsRef.current = snapshot;
      setColumns(snapshot);
      dragSnapshotRef.current = null;
    }
  }

  function openCreateTaskModal(columnId: string) {
    if (movePendingRef.current || activeDragTaskIdRef.current) return;
    setCreateColumnId(columnId);
    setEditingTaskId(null);
    setTaskError(null);
    setModalMode('create-task');
  }

  function openEditTaskModal(taskId: string) {
    if (movePendingRef.current || activeDragTaskIdRef.current) return;
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
        assigneeId: values.assigneeId || null,
        deadline: values.deadline || null,
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
          assigneeId: values.assigneeId || null,
          deadline: values.deadline || null,
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

  async function handleCreateColumn(values: ColumnFormValues) {
    setTaskError(null);
    setIsSavingColumn(true);

    try {
      await createColumnMutation.mutateAsync(values.title);
      closeModal();
    } catch {
      setTaskError('Не удалось создать колонку. Попробуй ещё раз.');
    } finally {
      setIsSavingColumn(false);
    }
  }

  async function handleUpdateColumn(values: ColumnFormValues) {
    if (!editingColumnId) return;

    setTaskError(null);
    setIsSavingColumn(true);

    try {
      await updateColumnMutation.mutateAsync({
        columnId: editingColumnId,
        title: values.title,
      });
      closeModal();
    } catch {
      setTaskError('Не удалось переименовать колонку. Попробуй ещё раз.');
    } finally {
      setIsSavingColumn(false);
    }
  }

  async function handleDeleteColumn(columnId: string) {
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

    setTaskError(null);
    setIsSavingColumn(true);

    try {
      await deleteColumnMutation.mutateAsync(columnId);
    } catch {
      setTaskError('Не удалось удалить колонку. Попробуй ещё раз.');
    } finally {
      setIsSavingColumn(false);
    }
  }

  async function handleMoveColumn(
    columnId: string,
    direction: 'left' | 'right',
  ) {
    const currentColumns = columnsRef.current;
    const currentIndex = currentColumns.findIndex(
      (column) => column.id === columnId,
    );
    const targetIndex = direction === 'left'
      ? currentIndex - 1
      : currentIndex + 1;

    if (
      currentIndex < 0
      || targetIndex < 0
      || targetIndex >= currentColumns.length
    ) {
      return;
    }

    const reordered = [...currentColumns];
    [reordered[currentIndex], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[currentIndex],
    ];

    setTaskError(null);
    setIsSavingColumn(true);

    try {
      await reorderColumnsMutation.mutateAsync(
        reordered.map((column) => column.id),
      );
    } catch {
      setTaskError('Не удалось изменить порядок колонок. Попробуй ещё раз.');
    } finally {
      setIsSavingColumn(false);
    }
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
        <Button
          variant="secondary"
          onClick={openCreateColumnModal}
          disabled={isSavingColumn || isSavingMove}
        >
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
              onDeleteColumn={(columnId) => void handleDeleteColumn(columnId)}
              onMoveColumn={(columnId, direction) =>
                void handleMoveColumn(columnId, direction)
              }
              columnIndex={columns.indexOf(column)}
              columnCount={columns.length}
              isSaving={isSavingColumn || isSavingMove}
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
          {boardMembersQuery.isPending ? (
            <p>Loading board members...</p>
          ) : boardMembersQuery.isError ? (
            <div>
              <p role="alert">Could not load board members.</p>
              <Button onClick={() => void boardMembersQuery.refetch()}>
                Try again
              </Button>
            </div>
          ) : (
            <TaskForm
              members={boardMembersQuery.data}
              defaultValues={{
                title: '',
                description: '',
                assigneeId: '',
                deadline: '',
              }}
              submitLabel={isSavingTask ? 'Creating...' : 'Create Task'}
              onSubmit={handleCreateTask}
              onCancel={closeModal}
              isSubmitting={isSavingTask}
            />
          )}
        </Modal>
      )}

      {modalMode === 'edit-task' && editingTask && (
        <Modal title="Edit Task" onClose={closeModal}>
          {taskError && (
            <p role="alert" className="task-form__error">
              {taskError}
            </p>
          )}

          {boardMembersQuery.isPending ? (
            <p>Loading board members...</p>
          ) : boardMembersQuery.isError ? (
            <div>
              <p role="alert">Could not load board members.</p>
              <Button onClick={() => void boardMembersQuery.refetch()}>
                Try again
              </Button>
            </div>
          ) : (
            <TaskForm
              members={boardMembersQuery.data}
              defaultValues={{
                title: editingTask.title,
                description: editingTask.description,
                assigneeId: editingTask.assigneeId ?? '',
                deadline: editingTask.deadline ?? '',
              }}
              submitLabel={isSavingTask ? 'Saving...' : 'Save Changes'}
              onSubmit={handleUpdateTask}
              onCancel={closeModal}
              isSubmitting={isSavingTask}
            />
          )}

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
            isSubmitting={isSavingColumn}
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
            isSubmitting={isSavingColumn}
          />
        </Modal>
      )}
    </>
  );
}

export default KanbanBoard;