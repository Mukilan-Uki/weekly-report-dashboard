import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function ManagerReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    user: '',
    category: '',
    status: '',
    weekStart: '',
    weekEnd: '',
  });

  async function loadUsers() {
    try {
      const res = await client.get('/auth/users');
      setUsers(res.data);
    } catch {
      // non-blocking
    }
  }

  async function loadCategories() {
    try {
      const res = await client.get('/categories');
      setCategories(res.data);
    } catch {
      // non-blocking
    }
  }

  async function loadReports() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.user) params.set('user', filters.user);
      if (filters.category) params.set('category', filters.category);
      if (filters.status) params.set('status', filters.status);
      if (filters.weekStart) params.set('weekStart', filters.weekStart);
      if (filters.weekEnd) params.set('weekEnd', filters.weekEnd);

      const res = await client.get(`/reports/manager/all?${params.toString()}`);
      setReports(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role === 'manager' || user?.role === 'admin') {
      loadUsers();
      loadCategories();
      loadReports();
    }
  }, [user]);

  function updateFilter(name, value) {
    setFilters((f) => ({ ...f, [name]: value }));
  }

  if (user?.role !== 'manager' && user?.role !== 'admin') {
    return <p>Only managers and admins can view this page.</p>;
  }

  return (
    <div>
      <h2>All Reports</h2>
      {error && <p className="error">{error}</p>}

      <div className="card filter">
        <div className="row">
          <label>
            Team Member
            <select
              value={filters.user}
              onChange={(e) => updateFilter('user', e.target.value)}
            >
              <option value="">All</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
            >
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="needs-correction">Needs Correction</option>
              <option value="approved">Approved</option>
            </select>
          </label>
        </div>
        <div className="row">
          <label>
            From
            <input
              type="date"
              value={filters.weekStart}
              onChange={(e) => updateFilter('weekStart', e.target.value)}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={filters.weekEnd}
              onChange={(e) => updateFilter('weekEnd', e.target.value)}
            />
          </label>
          <button className="secondary" onClick={loadReports}>
            Apply
          </button>
          <button
            className="secondary"
            onClick={() => {
              setFilters({ user: '', category: '', status: '', weekStart: '', weekEnd: '' });
              setTimeout(loadReports, 0);
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {!loading && reports.length === 0 && <p>No reports match the filters.</p>}

      <div className="list">
        {reports.map((r) => (
          <div key={r._id} className="card">
            <div className="row between">
              <strong>{r.user?.name}</strong>
              <span>Week of {r.weekStart}</span>
            </div>
            <p>
              <strong>Done:</strong> {r.done}
            </p>
            <p>
              <strong>Plan:</strong> {r.plan}
            </p>
            <p>
              <strong>Hours:</strong> {r.hours}h
            </p>
            <p className="muted">
              Category: {r.category?.name || '—'} · Status:{' '}
              <span className={`badge ${r.status}`}>{r.status}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
