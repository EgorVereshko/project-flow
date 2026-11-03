import { apiRequest } from './api';
import type { AppUser } from '../types/board';

type UsersResponse = {
  users: AppUser[];
};

export async function getUsers(
  accessToken: string,
): Promise<AppUser[]> {
  const response = await apiRequest<UsersResponse>(
    '/api/users',
    { method: 'GET' },
    accessToken,
  );

  return response.users;
}
