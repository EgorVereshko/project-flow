import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import { getBoards } from '../../services/boardsApi';
import type { Board } from '../../types/board';

import { useAuthStore } from '../../features/auth/authStore';

import './DashboardPage.scss';

function DashboardPage() {
  const accessToken = useAuthStore((state) => state.accessToken)

  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setBoards([]);
      setIsLoading(false);
      return;
    }

    const token = accessToken;
    let isCurrent = true;

    async function loadBoards() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getBoards(token);

        if (isCurrent) {
          setBoards(data);
        }
      } catch {
        if (isCurrent) {
          setError('Не удалось загрузить данные дашборда.');
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadBoards();

    return () => {
      isCurrent = false;
    };
  }, [accessToken]);

  const totalTasks = boards.reduce(
    (total, board) =>
      total +
      board.columns.reduce(
        (columnTotal, column) =>
          columnTotal + column.tasks.length,
        0,
      ),
    0,
  );

  // Пока в Task нет status, completedAt или другого признака
  // завершения, достоверно посчитать Completed нельзя.
  const stats = [
    {
      title: 'Projects',
      value: boards.length,
    },
    {
      title: 'Tasks',
      value: totalTasks,
    },
    {
      title: 'Completed',
      value: '—',
    },
  ];

  const recentBoards = [...boards]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="dashboard">
        <p>Загрузка дашборда...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <h1 className="dashboard__title">Dashboard</h1>
        <p role="alert">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Повторить
        </Button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Dashboard</h1>
          <p className="dashboard__subtitle">
            Welcome back!
          </p>
        </div>

        <Link to="/boards">
          <Button>+ New Board</Button>
        </Link>
      </header>

      <section className="dashboard__stats">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="dashboard__stat-card"
          >
            <h3 className="dashboard__stat-title">
              {stat.title}
            </h3>

            <strong className="dashboard__stat-value">
              {stat.value}
            </strong>
          </Card>
        ))}
      </section>

      <section className="dashboard__recent">
        <div className="dashboard__section-header">
          <h2 className="dashboard__section-title">
            Recent Boards
          </h2>

          <Link
            to="/boards"
            className="dashboard__view-all"
          >
            View all
          </Link>
        </div>

        <div className="dashboard__board-list">
          {recentBoards.length === 0 ? (
            <p>
              Пока нет досок. Создай первую доску!
            </p>
          ) : (
            recentBoards.map((board) => {
              const actualTasksCount =
                board.columns.reduce(
                  (total, column) =>
                    total + column.tasks.length,
                  0,
                );

              return (
                <Link
                  key={board.id}
                  to={`/boards/${board.id}`}
                  className="dashboard__board-item"
                >
                  <div>
                    <h3 className="dashboard__board-name">
                      {board.name}
                    </h3>

                    <p className="dashboard__board-tasks">
                      {actualTasksCount} tasks
                    </p>
                  </div>

                  <span className="dashboard__board-arrow">
                    →
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;