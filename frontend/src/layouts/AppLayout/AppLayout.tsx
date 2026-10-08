import { Outlet } from 'react-router-dom';

import './AppLayout.scss';

function AppLayout() {
  return (
    <div className="app-layout">
      <header className="app-layout__header">
        <strong>ProjectFlow</strong>
      </header>

      <main className="app-layout__main">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;