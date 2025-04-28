import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../app/store/slices/auth.slice';

/**
 * Sidebar navigation component
 */
const Sidebar: React.FC = () => {
  const user = useSelector(selectUser);

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul className="nav-list">
          <li className="nav-item">
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
              Dashboard
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/decks" className={({ isActive }) => isActive ? 'active' : ''}>
              My Decks
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/study" className={({ isActive }) => isActive ? 'active' : ''}>
              Study
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/stats" className={({ isActive }) => isActive ? 'active' : ''}>
              Statistics
            </NavLink>
          </li>
          {user?.role === 'admin' && (
            <li className="nav-item admin-item">
              <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
                Admin Panel
              </NavLink>
            </li>
          )}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
          Settings
        </NavLink>
        <NavLink to="/help" className={({ isActive }) => isActive ? 'active' : ''}>
          Help
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
