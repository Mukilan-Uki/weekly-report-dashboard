import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import StatusBadge from '../components/StatusBadge';

// Page 5: Manager review — approve or request changes with a comment.
// Only managers/admins can open this page (see ProtectedRoute managerOnly).
export default function ManagerReview() {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState('');
  const [week, setWeek] = useState('');
  const [notes, setNotes] = useState({}); // comment text per report id
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ status: 'submitted' });
      if (userFilter) params.append('user', userFilter);
      if (week) params.append('weekStart', week);
      const res = await client.get(`/reports?${params.toString()}`);
      setReports(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load review queue');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    client.get('/auth/users').then((res) => setUsers(res.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setNote(id, value) {
    setNotes((n) => ({ ...n, [id]: value }));
  }

  // Approve with optional note.
  async function handleApprove(id) {
    setError('');
    try {
      const res = await client.post(`/reports/${id}/approve`, { text: notes[id] || '' });
      setReports((list) => list.map((r) => (r._id === id ? res.data : r)));
      setNote(id, '');
    } catch (err) {
      setError(err.response?.data?.message || 'Approve failed');
    }
  }

  // Request changes REQUIRES a comment so the member knows what to fix.
  async function handleRequestChanges(id) {
    if (!notes[id]?.trim()) {
      setError('Please write what needs correction before sending back');
      return;
    }
    setError('');
    try {
      const res = await client.post(`/reports/${id}/request-changes`, { text: notes[id] });
      setReports((list) => list.map((r) => (r._id === id ? res.data : r)));
      setNote(id, '');
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    }
  }

  return (
    <div>
      <h2>Manager Review — Submitted Reports</h2>
      {error && <p className="error">{error}</p>}

      <div className="row filter">
        <label>
          Member
          <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
            <option value="">All members</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </label>
        <label>
          Week
          <input type="date" value={week} onChange={(e) => setWeek(e.target.value)} />
        </label>
        <button className="secondary" onClick={load}>
          Apply
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : reports.length === 0 ? (
        <p>Nothing waiting for review. 🎉</p>
      ) : (
        <div className="list">
          {reports.map((r) => (
            <div key={r._id} className="card">
              <div className="row between">
                <strong>
                  {r.user?.name} — week of {r.weekStart} — {r.hours}h
                </strong>
                <StatusBadge status={r.status} />
              </div>
              <p>
                <strong>Done:</strong> {r.done}
              </p>
              <p>
                <strong>Plan:</strong> {r.plan}
              </p>
              {r.blockers && (
                <p>
                  <strong>Blockers:</strong> {r.blockers}
                </p>
              )}
              <p>
                <Link to={`/reports/${r._id}`}>Open full detail</Link>
              </p>
              <label>
                Comment {`(required to request changes)`}
                <textarea
                  value={notes[r._id] || ''}
                  onChange={(e) => setNote(r._id, e.target.value)}
                  placeholder="e.g. Approved, nice work / Please add testing hours"
                />
              </label>
              <div className="row">
                <button onClick={() => handleApprove(r._id)}>Approve</button>
                <button className="secondary" onClick={() => handleRequestChanges(r._id)}>
                  Request changes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
