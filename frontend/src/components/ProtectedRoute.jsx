import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function ProtectedRoute({ children, managerOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (managerOnly && !['manager', 'admin'].includes(user.role)) return <Navigate to="/reports" replace />;
  return children;
}
