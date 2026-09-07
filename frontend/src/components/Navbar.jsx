import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const isManager = user?.role === 'manager' || user?.role === 'admin';

  return (
    <nav className="nav">
      <Link to="/" className="brand">
        Weekly Reports
      </Link>
      <div className="links">
        {user ? (
          <>
            <Link to="/reports">My Reports</Link>
            {isManager && <Link to="/reports/manage">All Reports</Link>}
            {isManager && <Link to="/review">Review</Link>}
            {isManager && <Link to="/dashboard">Dashboard</Link>}
            {isManager && <Link to="/categories">Categories</Link>}
            {isManager && <Link to="/projects">Projects</Link>}
            {user?.role === 'admin' && <Link to="/users">Users</Link>}
            {isManager && <Link to="/profiles">Profiles</Link>}
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
