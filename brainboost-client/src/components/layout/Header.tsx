import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectUser } from '../../app/store/slices/auth.slice';
import { AppDispatch } from '../../app/store/store';

/**
 * Header component with navigation and user controls
 */
const Header: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="logo-container">
        <Link to="/" className="logo">
          BrainBoost
        </Link>
      </div>

      <nav className="main-nav">
        {/* Main navigation links will go here */}
      </nav>

      <div className="user-controls">
        {user && (
          <>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
            </div>
            <div className="dropdown-menu">
              <Link to="/profile" className="dropdown-item">
                Profile
              </Link>
              <button onClick={handleLogout} className="dropdown-item logout-btn">
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
