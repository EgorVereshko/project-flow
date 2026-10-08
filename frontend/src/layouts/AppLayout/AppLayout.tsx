import { Outlet } from 'react-router-dom';

import Sidebar from './Sidebar';

import './AppLayout.scss';

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-layout__content">
        <main className="app-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;