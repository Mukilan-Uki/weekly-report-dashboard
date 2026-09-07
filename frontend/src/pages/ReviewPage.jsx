import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function ReviewPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');

  async function load() {
    try {
      setLoading(true);
      const res = await client.get('/reports?status=submitted');
      setReports(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(id) {
    try {
      const res = await client.post(`/reports/${id}/approve`, { text: comment });
      setReports((list) => list.filter((r) => r._id !== id));
      setComment('');
    } catch (err) {
      setError(err.response?.data?.message || 'Approve failed');
    }
  }

  async function handleRequestChanges(id) {
    if (!comment.trim()) {
      setError('Please enter a comment for the correction request');
      return;
    }
    try {
      const res = await client.post(`/reports/${id}/request-changes`, { text: comment });
      setReports((list) => list.filter((r) => r._id !== id));
      setComment('');
    } catch (err) {
      setError(err.response?.data?.message || 'Request changes failed');
    }
  }

  if (user?.role !== 'manager' && user?.role !== 'admin') {
    return <p>Only managers and admins can review reports.</p>;
  }

  return (
    <div>
      <h2>Review Reports</h2>
      {error && <p className="error">{error}</p>}
      {loading && <p>Loading...</p>}
      {reports.length === 0 && <p>No reports pending review.</p>}

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
            <label>
              Comment
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
              />
            </label>
            <div className="row">
              <button className="secondary" onClick={() => handleApprove(r._id)}>
                Approve
              </button>
              <button className="danger" onClick={() => handleRequestChanges(r._id)}>
                Request Changes
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
