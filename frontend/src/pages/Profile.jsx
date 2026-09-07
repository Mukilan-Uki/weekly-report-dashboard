import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');

  async function loadUsers() {
    try {
      const res = await client.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    }
  }

  async function loadReports(userId) {
    try {
      const res = await client.get(`/reports?user=${userId}`);
      setReports(res.data);
    } catch {
      setReports([]);
    }
  }

  useEffect(() => {
    if (user?.role === 'manager' || user?.role === 'admin') {
      loadUsers();
    }
  }, [user]);

  function handleSelect(u) {
    setSelected(u);
    loadReports(u._id);
  }

  if (user?.role !== 'manager' && user?.role !== 'admin') {
    return <p>Only managers and admins can view team profiles.</p>;
  }

  return (
    <div>
      <h2>Team Member Profiles</h2>
      {error && <p className="error">{error}</p>}
      <div className="row">
        <div className="list" style={{ flex: 1 }}>
          {users.map((u) => (
            <div
              key={u._id}
              className={`card ${selected?._id === u._id ? 'selected' : ''}`}
              onClick={() => handleSelect(u)}
              style={{ cursor: 'pointer' }}
            >
              <strong>{u.name}</strong>
              <p className="muted">{u.email}</p>
              <span className={`badge ${u.role}`}>{u.role}</span>
            </div>
          ))}
        </div>
        <div style={{ flex: 2 }}>
          {selected ? (
            <div className="card">
              <h3>{selected.name}</h3>
              <p>
                <strong>Email:</strong> {selected.email}
              </p>
              <p>
                <strong>Role:</strong>{' '}
                <span className={`badge ${selected.role}`}>{selected.role}</span>
              </p>
              <h4>Reports</h4>
              {reports.length === 0 && <p className="muted">No reports yet.</p>}
              <div className="list">
                {reports.map((r) => (
                  <div key={r._id} className="card">
                    <div className="row between">
                      <strong>Week of {r.weekStart}</strong>
                      <span className={`badge ${r.status}`}>{r.status}</span>
                    </div>
                    <p>{r.done}</p>
                    <p className="muted">{r.hours}h</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="muted">Select a team member to view their profile.</p>
          )}
        </div>
      </div>
    </div>
  );
}
