import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import StatusBadge from '../components/StatusBadge';

// Page 3: Report history — past reports with statuses.
// Members see their own history; managers see everyone's (optional member filter).
export default function History() {
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('');
  const [week, setWeek] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (week) params.append('weekStart', week);
      const res = await client.get(`/reports?${params.toString()}`);
      setReports(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h2>Report History</h2>
      {error && <p className="error">{error}</p>}

      <div className="row filter">
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="needs-correction">Needs Correction</option>
            <option value="approved">Approved</option>
          </select>
        </label>
        <label>
          Week
          <input type="date" value={week} onChange={(e) => setWeek(e.target.value)} />
        </label>
        <button className="secondary" onClick={load}>
          Apply
        </button>
        {(status || week) && (
          <button
            className="secondary"
            onClick={() => {
              setStatus('');
              setWeek('');
              setTimeout(load, 0);
            }}
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : reports.length === 0 ? (
        <p>No reports match these filters.</p>
      ) : (
        <div className="list">
          {reports.map((r) => (
            <div key={r._id} className="card">
              <div className="row between">
                <strong>
                  {r.user?.name || 'Me'} — week of {r.weekStart}
                </strong>
                <StatusBadge status={r.status} />
              </div>
              <p className="muted">
                {r.hours}h {r.category?.name ? `· ${r.category.name}` : ''} ·{' '}
                <Link to={`/reports/${r._id}`}>Open detail</Link>
              </p>
              <p>{r.done.slice(0, 120)}{r.done.length > 120 ? '…' : ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
