import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="nav">
      <Link to="/" className="brand">
        Weekly Reports
      </Link>
      <div className="links">
        {user ? (
          <>
            <Link to="/reports">My Reports</Link>
            <Link to="/history">History</Link>
            <Link to="/dashboard">Dashboard</Link>
            {isManager && <Link to="/review">Review</Link>}
            {isManager && <Link to="/categories">Categories</Link>}
            <span className="user">
              {user.name} ({user.role})
            </span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
