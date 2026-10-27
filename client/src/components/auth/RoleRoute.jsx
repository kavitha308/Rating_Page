import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRoleRedirectPath } from '../../utils/navigation';
import LoadingSpinner from '../common/LoadingSpinner';

const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Checking user permissions..." fullScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect user to their own role's home view
    const defaultPath = getRoleRedirectPath(user.role);
    return <Navigate to={defaultPath} replace />;
  }

  return children ? children : <Outlet />;
};

export default RoleRoute;
