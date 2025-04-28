import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '../store/slices/auth.slice';
import { fetchUserProfile } from '../store/slices/user.slice';
import { AppDispatch } from '../store/store';

/**
 * Protected Route component
 * Redirects to login if user is not authenticated
 * Loads user profile if not already loaded
 */
const ProtectedRoute: React.FC = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  // Load user profile if authenticated but profile not loaded
  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(fetchUserProfile());
    }
  }, [isAuthenticated, user, dispatch]);

  // If not authenticated, redirect to login with return path
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Render children routes
  return <Outlet />;
};

export default ProtectedRoute;
