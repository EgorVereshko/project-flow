
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type AccessTokenRefresher = (
  expiredToken: string,
) => Promise<string | null>;

let accessTokenRefresher: AccessTokenRefresher | null = null;

export function setAccessTokenRefresher(
  refresher: AccessTokenRefresher,
): void {
  accessTokenRefresher = refresher;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null,
  retryAfterRefresh = true,
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (
    response.status === 401
    && retryAfterRefresh
    && accessToken
    && accessTokenRefresher
  ) {
    const refreshedToken = await accessTokenRefresher(accessToken);

    if (refreshedToken) {
      return apiRequest<T>(path, options, refreshedToken, false);
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const body = data as ApiErrorBody | null;

    throw new ApiError(
      body?.error?.message ?? 'Произошла ошибка. Попробуйте ещё раз.',
      response.status,
      body?.error?.code,
    );
  }

  return data as T;
}