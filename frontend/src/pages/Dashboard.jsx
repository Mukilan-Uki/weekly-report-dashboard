import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-left">
          <h2>Weekly Report Dashboard</h2>
        </div>
        <div className="nav-right">
          <span className="user-info">
            {user?.username} ({user?.role})
          </span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <h1>Welcome, {user?.username}!</h1>

        <div className="user-details">
          <h2>Your Profile</h2>
          <p>
            <strong>Username:</strong> {user?.username}
          </p>
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
          <p>
            <strong>Role:</strong> <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
          </p>
        </div>

        {hasRole('Manager') && (
          <div className="manager-section">
            <h2>Manager Only Section</h2>
            <p>You have access to manager-level features.</p>
            <button className="feature-btn">View Reports</button>
            <button className="feature-btn">Manage Team</button>
          </div>
        )}

        {hasRole('Admin') && (
          <div className="admin-section">
            <h2>Admin Only Section</h2>
            <p>You have access to admin-level features.</p>
            <button className="feature-btn">User Management</button>
            <button className="feature-btn">System Settings</button>
          </div>
        )}

        {hasRole('TeamMember') && (
          <div className="member-section">
            <h2>Team Member Section</h2>
            <p>Submit your weekly reports here.</p>
            <button className="feature-btn">Submit Report</button>
            <button className="feature-btn">View My Reports</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
