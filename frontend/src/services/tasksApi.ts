
import { apiRequest } from './api';
import type { Task } from '../types/board';

type CreateTaskData = {
  columnId: string;
  title: string;
  description: string;
  assigneeId: string | null;
  deadline: string | null;
};

type UpdateTaskData = {
  title: string;
  description: string;
  assigneeId: string | null;
  deadline: string | null;
};

type MoveTaskData = {
  columnId: string;
  position: number;
};

type TaskResponse = {
  task: Task & { columnId: string };
};

export async function createTask(
  data: CreateTaskData,
  accessToken: string,
): Promise<Task> {
  const response = await apiRequest<TaskResponse>(
    '/api/tasks',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    accessToken,
  );

  return response.task;
}

export async function updateTask(
  taskId: string,
  data: UpdateTaskData,
  accessToken: string,
): Promise<Task> {
  const response = await apiRequest<TaskResponse>(
    `/api/tasks/${taskId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
    accessToken,
  );

  return response.task;
}

export async function deleteTask(
  taskId: string,
  accessToken: string,
): Promise<void> {
  await apiRequest<void>(
    `/api/tasks/${taskId}`,
    { method: 'DELETE' },
    accessToken,
  );
}

export async function moveTask(
  taskId: string,
  data: MoveTaskData,
  accessToken: string,
): Promise<void> {
  await apiRequest<{ success: boolean }>(
    `/api/tasks/${taskId}/move`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
    accessToken,
  );
}