<<<<<<< HEAD
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
=======
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// Wraps pages that need login.
// If not logged in -> go to /login.
// If managerOnly and user is not manager -> go to /reports.
export default function ProtectedRoute({ children, managerOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="center">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (managerOnly && user.role !== 'manager') {
    return <Navigate to="/reports" replace />;
  }
  return children;
}
>>>>>>> arena/01a06810-weekly-report-dashboard
