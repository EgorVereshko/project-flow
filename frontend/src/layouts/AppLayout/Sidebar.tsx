import { NavLink } from 'react-router-dom';

import './Sidebar.scss';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        ProjectFlow
      </div>

      <nav className="sidebar__nav">
        <NavLink
          to="/dashboard"
          className="sidebar__link"
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/boards"
          className="sidebar__link"
        >
          Boards
        </NavLink>
      </nav>

      <div className="sidebar__footer">
        <NavLink
          to="/settings"
          className="sidebar__link"
        >
          Settings
        </NavLink>

        <button className="sidebar__logout">
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;