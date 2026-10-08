import type {
  BoardColumn,
  Task,
} from '../types/board';

export function findColumnByTaskId(
  columns: BoardColumn[],
  taskId: string,
) {
  return columns.find((column) =>
    column.tasks.some(
      (task) => task.id === taskId,
    ),
  );
}

export function findTaskById(
  columns: BoardColumn[],
  taskId: string,
): Task | undefined {
  for (const column of columns) {
    const task = column.tasks.find(
      (item) => item.id === taskId,
    );

    if (task) {
      return task;
    }
  }

  return undefined;
}

export function findColumnById(
  columns: BoardColumn[],
  columnId: string,
) {
  return columns.find(
    (column) => column.id === columnId,
  );
}

export function moveTaskBetweenColumns(
  columns: BoardColumn[],
  taskId: string,
  sourceColumnId: string,
  targetColumnId: string,
  targetIndex?: number,
): BoardColumn[] {
  const sourceColumn =
    findColumnById(
      columns,
      sourceColumnId,
    );

  const targetColumn =
    findColumnById(
      columns,
      targetColumnId,
    );

  if (
    !sourceColumn ||
    !targetColumn
  ) {
    return columns;
  }

  const task =
    sourceColumn.tasks.find(
      (item) =>
        item.id === taskId,
    );

  if (!task) {
    return columns;
  }

  const newColumns =
    columns.map(
      (column) => {
        if (
          column.id ===
          sourceColumnId
        ) {
          return {
            ...column,
            tasks:
              column.tasks.filter(
                (item) =>
                  item.id !== taskId,
              ),
          };
        }

        return column;
      },
    );

  return newColumns.map(
    (column) => {
      if (
        column.id !==
        targetColumnId
      ) {
        return column;
      }

      const newTasks = [
        ...column.tasks,
      ];

      const index =
        targetIndex ??
        newTasks.length;

      newTasks.splice(
        index,
        0,
        task,
      );

      return {
        ...column,
        tasks: newTasks,
      };
    },
  );
}

export function addTaskToColumn(
  columns: BoardColumn[],
  columnId: string,
  task: Task,
): BoardColumn[] {
  return columns.map(
    (column) => {
      if (
        column.id !== columnId
      ) {
        return column;
      }

      return {
        ...column,
        tasks: [
          ...column.tasks,
          task,
        ],
      };
    },
  );
}

export function updateTask(
  columns: BoardColumn[],
  taskId: string,
  updatedTask: Task,
): BoardColumn[] {
  return columns.map(
    (column) => ({
      ...column,
      tasks: column.tasks.map(
        (task) =>
          task.id === taskId
            ? updatedTask
            : task,
      ),
    }),
  );
}

export function deleteTask(
  columns: BoardColumn[],
  taskId: string,
): BoardColumn[] {
  return columns.map(
    (column) => ({
      ...column,
      tasks: column.tasks.filter(
        (task) =>
          task.id !== taskId,
      ),
    }),
  );
}

export function addColumn(
  columns: BoardColumn[],
  column: BoardColumn,
): BoardColumn[] {
  return [
    ...columns,
    column,
  ];
}

export function updateColumn(
  columns: BoardColumn[],
  columnId: string,
  title: string,
): BoardColumn[] {
  return columns.map(
    (column) =>
      column.id === columnId
        ? {
            ...column,
            title,
          }
        : column,
  );
}

export function deleteColumn(
  columns: BoardColumn[],
  columnId: string,
): BoardColumn[] {
  return columns.filter(
    (column) =>
      column.id !== columnId,
  );
}