import express from 'express';
import cors from 'cors';

import authRoutes from './modules/auth/auth.routes.js';
import boardsRoutes from './modules/boards/boards.routes.js';
import tasksRoutes from './modules/tasks/tasks.routes.js';

const app = express();

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

app.disable('x-powered-by');

app.use(
  cors({
    origin(origin, callback) {
      // Разрешаем запросы без Origin для локальных проверок API
      // и запросы с разрешённых адресов frontend.
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'ProjectFlow API is running',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/boards', boardsRoutes);

app.use('/api/tasks', tasksRoutes);

app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

app.use((
  error: unknown,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction,
) => {
  console.error('Unhandled request error:', error);

  if (res.headersSent) {
    return;
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});

export default app;