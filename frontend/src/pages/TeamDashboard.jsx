import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function TeamDashboard() {
  const { user } = useAuth();
  const [week, setWeek] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const url = week ? `/dashboard/summary?weekStart=${week}` : '/dashboard/summary';
      const res = await client.get(url);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxHours = Math.max(1, ...(data?.hoursByUser?.map((u) => u.hours) || [1]));

  return (
    <div>
      <h2>
        {user?.role === 'manager' ? 'Team Dashboard' : 'My Dashboard'}
      </h2>

      <div className="row filter">
        <label>
          Week
          <input type="date" value={week} onChange={(e) => setWeek(e.target.value)} />
        </label>
        <button className="secondary" onClick={load}>
          Apply
        </button>
        {week && (
          <button
            className="secondary"
            onClick={() => {
              setWeek('');
              setTimeout(load, 0);
            }}
          >
            Clear
          </button>
        )}
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p>Loading...</p>}

      {data && (
        <>
          <div className="stats">
            <div className="stat">
              <span className="num">{data.totalReports}</span>
              <span>Reports</span>
            </div>
            <div className="stat">
              <span className="num">{data.totalHours}</span>
              <span>Total hours</span>
            </div>
            <div className="stat">
              <span className="num">{data.totalMembers}</span>
              <span>Members</span>
            </div>
          </div>

          <div className="card">
            <h3>Hours by person</h3>
            {data.hoursByUser.length === 0 && <p className="muted">No data yet.</p>}
            {data.hoursByUser.map((u) => (
              <div key={u.name} className="bar-row">
                <span className="bar-label">{u.name}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(u.hours / maxHours) * 100}%` }}
                  />
                </div>
                <span>
                  {u.hours}h ({u.count})
                </span>
              </div>
            ))}
          </div>

          <div className="card">
            <h3>Recent reports</h3>
            {data.recent.length === 0 && <p className="muted">No reports yet.</p>}
            {data.recent.map((r) => (
              <div key={r._id} className="recent">
                <strong>{r.user?.name}</strong> — week of {r.weekStart} — {r.hours}h
                <div className="muted">{r.done.slice(0, 80)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
