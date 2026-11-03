import { apiRequest } from './api';
import type {
  ProfileTaskStatus,
  TaskPriority,
  WorkflowStatus,
} from '../types/board';

export const PROFILE_QUERY_KEY = ['users', 'me', 'profile'] as const;

export type ProfileTask = {
  id: string;
  title: string;
  boardId: string;
  boardName: string;
  columnId: string;
  columnTitle: string;
  workflowStatus: WorkflowStatus;
  status: ProfileTaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  assigneeName?: string;
};

export type ProfileData = {
  profile: {
    username: string;
    email: string;
    createdAt: string;
  };
  stats: {
    totalTasks: number;
    completed: number;
    inProgress: number;
    todo: number;
    overdue: number;
  };
  boards: {
    id: string;
    name: string;
    description: string;
    taskCount: number;
    completedCount: number;
    completionPercent: number;
  }[];
  assignedTasks: ProfileTask[];
  createdTasks: ProfileTask[];
};

type ProfileResponse = ProfileData;
type UpdateProfileResponse = { profile: ProfileData['profile'] };

export async function getMyProfile(
  accessToken: string,
): Promise<ProfileData> {
  const response = await apiRequest<ProfileResponse>(
    '/api/users/me/profile',
    { method: 'GET' },
    accessToken,
  );

  return response;
}

export async function updateMyProfile(
  name: string,
  accessToken: string,
): Promise<ProfileData['profile']> {
  const response = await apiRequest<UpdateProfileResponse>(
    '/api/users/me/profile',
    {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    },
    accessToken,
  );

  return response.profile;
}
