
import { create } from 'zustand';

import {
  apiRequest,
  setAccessTokenRefresher,
} from '@/services/api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  status: AuthStatus;
  initialized: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshAccessToken: (expiredToken: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

let refreshPromise: Promise<string | null> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  status: 'loading',
  initialized: false,

  login: async (email, password) => {
    const result = await apiRequest<AuthResponse>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
    );

    set({
      user: result.user,
      accessToken: result.accessToken,
      status: 'authenticated',
      initialized: true,
    });
  },

  register: async (name, email, password) => {
    const result = await apiRequest<AuthResponse>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      },
    );

    set({
      user: result.user,
      accessToken: result.accessToken,
      status: 'authenticated',
      initialized: true,
    });
  },

  refreshSession: async () => {
    if (get().initialized) {
      return;
    }

    if (refreshPromise) {
      await refreshPromise;
      return;
    }

    set({ status: 'loading' });
    await get().refreshAccessToken('');
  },

  refreshAccessToken: async (expiredToken) => {
    const { accessToken: currentToken, initialized, status } = get();

    if (initialized && status !== 'authenticated') {
      return null;
    }

    if (currentToken && currentToken !== expiredToken) {
      return currentToken;
    }

    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        const result = await apiRequest<AuthResponse>(
          '/api/auth/refresh',
          { method: 'POST' },
        );

        set({
          user: result.user,
          accessToken: result.accessToken,
          status: 'authenticated',
          initialized: true,
        });

        return result.accessToken;
      } catch {
        set({
          user: null,
          accessToken: null,
          status: 'unauthenticated',
          initialized: true,
        });

        return null;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  },

  logout: async () => {
    try {
      await apiRequest<void>('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      set({
        user: null,
        accessToken: null,
        status: 'unauthenticated',
        initialized: true,
      });
    }
  },
}));

setAccessTokenRefresher((expiredToken) =>
  useAuthStore.getState().refreshAccessToken(expiredToken),
);