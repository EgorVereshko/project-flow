
import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuthStore } from './authStore';

function AuthLoading() {
  return (
    <main className="auth-loading">
      <div className="auth-loading__spinner" />
      <p>Загружаем ProjectFlow...</p>
    </main>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const status = useAuthStore((state) => state.status);
  const initialized = useAuthStore((state) => state.initialized);
  const refreshSession = useAuthStore((state) => state.refreshSession);

  useEffect(() => {
    if (!initialized) {
      void refreshSession();
    }
  }, [initialized, refreshSession]);

  if (!initialized || status === 'loading') {
    return <AuthLoading />;
  }

  if (status !== 'authenticated') {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const initialized = useAuthStore((state) => state.initialized);
  const refreshSession = useAuthStore((state) => state.refreshSession);

  useEffect(() => {
    if (!initialized) {
      void refreshSession();
    }
  }, [initialized, refreshSession]);

  if (!initialized || status === 'loading') {
    return <AuthLoading />;
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}