import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// Wraps pages that need login.
// If not logged in -> go to /login.
// If managerOnly and user is member -> go to /reports.
// (Admins are allowed everywhere managers are.)
export default function ProtectedRoute({ children, managerOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="center">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (managerOnly && user.role !== 'manager' && user.role !== 'admin') {
    return <Navigate to="/reports" replace />;
  }
  return children;
}
