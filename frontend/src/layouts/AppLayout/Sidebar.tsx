import { NavLink, useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/features/auth/authStore';

import './Sidebar.scss';

function Sidebar() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        ProjectFlow
      </div>

      <nav className="sidebar__nav">
        <NavLink to="/dashboard" className="sidebar__link">
          Dashboard
        </NavLink>

        <NavLink to="/boards" className="sidebar__link">
          Boards
        </NavLink>
      </nav>

      <div className="sidebar__footer">
        {user && (
          <div className="sidebar__user">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
        )}

        <button
          className="sidebar__logout"
          type="button"
          onClick={() => void handleLogout()}
        >
          <svg xmlns="http://w3.org" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          &nbsp;
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;