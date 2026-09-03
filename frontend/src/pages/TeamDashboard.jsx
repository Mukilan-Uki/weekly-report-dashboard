import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import client from '../api/client';
import { useAuth } from '../auth/AuthContext';

const PIE_COLORS = {
  draft: '#9ca3af',
  submitted: '#2563eb',
  'needs-correction': '#f59e0b',
  approved: '#16a34a',
};

// Page 7: Team dashboard — filters + Recharts bar & pie charts.
export default function TeamDashboard() {
  const { user } = useAuth();
  const [week, setWeek] = useState('');
  const [status, setStatus] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (week) params.append('weekStart', week);
      if (status) params.append('status', status);
      const res = await client.get(`/dashboard/summary?${params.toString()}`);
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

  // Recharts pie needs [{ name, value }] — convert the byStatus object.
  const pieData = data
    ? Object.entries(data.byStatus).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div>
      <h2>{user?.role === 'member' ? 'My Dashboard' : 'Team Dashboard'}</h2>

      <div className="row filter">
        <label>
          Week
          <input type="date" value={week} onChange={(e) => setWeek(e.target.value)} />
        </label>
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
        <button className="secondary" onClick={load}>
          Apply
        </button>
        {(week || status) && (
          <button
            className="secondary"
            onClick={() => {
              setWeek('');
              setStatus('');
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

          <div className="grid-2">
            <div className="card">
              <h3>Hours by person</h3>
              {data.hoursByUser.length === 0 ? (
                <p className="muted">No data yet.</p>
              ) : (
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={data.hoursByUser}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="hours" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="card">
              <h3>Reports by status</h3>
              {data.totalReports === 0 ? (
                <p className="muted">No data yet.</p>
              ) : (
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90}>
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={PIE_COLORS[entry.name] || '#6b7280'} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3>Recent reports</h3>
            {data.recent.length === 0 && <p className="muted">No reports yet.</p>}
            {data.recent.map((r) => (
              <div key={r._id} className="recent">
                <strong>{r.user?.name}</strong> — week of {r.weekStart} — {r.hours}h ({r.status})
                <div className="muted">{r.done.slice(0, 80)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
