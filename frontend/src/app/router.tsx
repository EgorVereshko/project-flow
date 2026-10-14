import { Navigate, createBrowserRouter } from 'react-router-dom';

import AppLayout from '@/layouts/AppLayout/AppLayout';

import LoginPage from '@/pages/Login/LoginPage';
import RegisterPage from '@/pages/Register/RegisterPage';
import DashboardPage from '@/pages/Dashboard/DashboardPage';
import BoardsPage from '@/pages/Boards/BoardsPage';
import BoardPage from '@/pages/Board/BoardPage';

import {
  ProtectedRoute,
  PublicOnlyRoute,
} from '@/features/auth/AuthGuards';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'boards',
        element: <BoardsPage />,
      },
      {
        path: 'boards/:boardId',
        element: <BoardPage />,
      },
    ],
  },
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    ),
  },
]);