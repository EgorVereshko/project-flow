import { Link } from 'react-router-dom';

import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';

import './DashboardPage.scss';

const stats = [
  {
    title: 'Projects',
    value: 4,
  },
  {
    title: 'Tasks',
    value: 24,
  },
  {
    title: 'Completed',
    value: 18,
  },
];

const recentBoards = [
  {
    id: '1',
    name: 'Website Redesign',
    tasks: 12,
  },
  {
    id: '2',
    name: 'Mobile Application',
    tasks: 8,
  },
  {
    id: '3',
    name: 'Marketing Campaign',
    tasks: 5,
  },
];

function DashboardPage() {
  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">
            Dashboard
          </h1>

          <p className="dashboard__subtitle">
            Welcome back!
          </p>
        </div>

        <Button>
          + New Board
        </Button>
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
          {recentBoards.map((board) => (
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
                  {board.tasks} tasks
                </p>
              </div>

              <span className="dashboard__board-arrow">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;