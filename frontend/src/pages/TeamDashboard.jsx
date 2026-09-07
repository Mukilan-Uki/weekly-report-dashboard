import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function TeamDashboard() {
  const { user } = useAuth();
  const [week, setWeek] = useState('');
  const [data, setData] = useState(null);
  const [trend, setTrend] = useState([]);
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

  async function loadTrend() {
    try {
      const res = await client.get('/dashboard/trend?weeks=8');
      setTrend(res.data);
    } catch {
      // non-blocking
    }
  }

  useEffect(() => {
    load();
    loadTrend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxHours = Math.max(1, ...(data?.hoursByUser?.map((u) => u.hours) || [1]));
  const totalStatus = Object.values(data?.byStatus || {}).reduce((a, b) => a + b, 0) || 1;
  const maxTrend = Math.max(1, ...trend.map((t) => t.count));

  function pieBackground() {
    if (!data?.byStatus) return 'transparent';
    const colors = {
      draft: '#9ca3af',
      submitted: '#3b82f6',
      'needs-correction': '#f59e0b',
      approved: '#10b981',
    };
    const parts = [];
    let cumulative = 0;
    for (const [status, count] of Object.entries(data.byStatus)) {
      if (count === 0) continue;
      const pct = (count / totalStatus) * 100;
      parts.push(`${colors[status] || '#ccc'} ${cumulative}% ${cumulative + pct}%`);
      cumulative += pct;
    }
    return `conic-gradient(${parts.join(', ')})`;
  }

  return (
    <div>
      <h2>
        {user?.role === 'manager' || user?.role === 'admin' ? 'Team Dashboard' : 'My Dashboard'}
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
            <div className="stat">
              <span className="num">{data.complianceRate}%</span>
              <span>Compliance</span>
            </div>
            <div className="stat">
              <span className="num">{data.correctionCount}</span>
              <span>Corrections</span>
            </div>
            <div className="stat">
              <span className="num">{data.blockersCount}</span>
              <span>Blockers</span>
            </div>
          </div>

          <div className="charts">
            <div className="card">
              <h3>Submission / Approval Status</h3>
              <div className="pie-wrap">
                <div
                  className="pie"
                  style={{ background: pieBackground() }}
                  title={`${totalStatus} reports`}
                />
                <div className="pie-legend">
                  {data.byStatus &&
                    Object.entries(data.byStatus).map(([status, count]) => (
                      <div key={status} className="legend-item">
                        <span
                          className="legend-color"
                          style={{
                            background:
                              status === 'approved'
                                ? '#10b981'
                                : status === 'submitted'
                                  ? '#3b82f6'
                                  : status === 'needs-correction'
                                    ? '#f59e0b'
                                    : '#9ca3af',
                          }}
                        />
                        <span>
                          {status}: {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="card">
              <h3>Tasks trend (reports per week)</h3>
              {trend.length === 0 && <p className="muted">No data yet.</p>}
              <div className="trend">
                {trend.map((t) => (
                  <div key={t.weekStart} className="trend-col">
                    <div
                      className="trend-bar"
                      style={{
                        height: `${(t.count / maxTrend) * 100}%`,
                        background: '#2563eb',
                      }}
                    />
                    <div className="trend-label">
                      {new Date(t.weekStart).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="trend-value">{t.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Workload distribution (hours by person)</h3>
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
            <h3>Time spent by task type</h3>
            {data.hoursByCategory?.length === 0 && <p className="muted">No data yet.</p>}
            {data.hoursByCategory?.map((c) => (
              <div key={c.name} className="bar-row">
                <span className="bar-label">{c.name}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(c.count / Math.max(1, data.totalReports)) * 100}%`,
                      background: '#8b5cf6',
                    }}
                  />
                </div>
                <span>{c.count} reports</span>
              </div>
            ))}
          </div>

          <div className="card">
            <h3>Recent reports</h3>
            {data.recent.length === 0 && <p className="muted">No reports yet.</p>}
            {data.recent.map((r) => (
              <div key={r._id} className="recent">
                <strong>{r.user?.name}</strong> — week of {r.weekStart} — {r.hours}h
                <div className="muted">{r.done?.slice(0, 80) || ''}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
