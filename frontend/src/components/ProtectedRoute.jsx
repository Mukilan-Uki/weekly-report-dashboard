import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRoles = null }) => {
  const { isAuthenticated, loading, hasRole } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return (
      <div className="unauthorized">
        <h1>Access Denied</h1>
        <p>You don't have the required permissions to access this page.</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
