import { createBrowserRouter } from 'react-router-dom';

import AppLayout from '@/layouts/AppLayout/AppLayout';

import LoginPage from '@/pages/Login/LoginPage';
import RegisterPage from '@/pages/Register/RegisterPage';
import DashboardPage from '@/pages/Dashboard/DashboardPage';
import BoardsPage from '@/pages/Boards/BoardsPage';
import BoardPage from '@/pages/Board/BoardPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
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
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
]);