import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute component
 * Checks if user is authenticated and has required role
 * If not, redirects to login page
 */
function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && userString) {
    const user = JSON.parse(userString);
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
