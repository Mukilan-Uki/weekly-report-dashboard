import { useEffect, useState } from 'react';
import client from '../api/client';

// Monday of current week as yyyy-mm-dd (matches backend weekStart format).
function currentWeekMonday() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

const emptyForm = {
  weekStart: currentWeekMonday(),
  done: '',
  plan: '',
  blockers: '',
  hours: '',
};

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [filterWeek, setFilterWeek] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const url = filterWeek ? `/reports?weekStart=${filterWeek}` : '/reports';
      const res = await client.get(url);
      setReports(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        // Edit existing report (weekStart cannot change — backend ignores it on PUT)
        const res = await client.put(`/reports/${editingId}`, {
          done: form.done,
          plan: form.plan,
          blockers: form.blockers,
          hours: Number(form.hours),
        });
        setReports((list) => list.map((r) => (r._id === editingId ? res.data : r)));
        setEditingId(null);
      } else {
        const res = await client.post('/reports', {
          ...form,
          hours: Number(form.hours),
        });
        setReports((list) => [res.data, ...list]);
      }
      setForm(emptyForm);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  }

  function startEdit(report) {
    setEditingId(report._id);
    setForm({
      weekStart: report.weekStart,
      done: report.done,
      plan: report.plan,
      blockers: report.blockers || '',
      hours: report.hours,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this report?')) return;
    try {
      await client.delete(`/reports/${id}`);
      setReports((list) => list.filter((r) => r._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  }

  return (
    <div>
      <h2>My Weekly Reports</h2>

      {error && <p className="error">{error}</p>}

      {/* Create / Edit form */}
      <form onSubmit={handleSubmit} className="card">
        <h3>{editingId ? 'Edit report' : 'New report'}</h3>
        <div className="row">
          <label>
            Week starting (Monday)
            <input
              type="date"
              value={form.weekStart}
              onChange={(e) => updateField('weekStart', e.target.value)}
              required
              disabled={!!editingId}
            />
          </label>
          <label>
            Hours
            <input
              type="number"
              min="0"
              max="168"
              value={form.hours}
              onChange={(e) => updateField('hours', e.target.value)}
              required
            />
          </label>
        </div>
        <label>
          Done this week
          <textarea
            value={form.done}
            onChange={(e) => updateField('done', e.target.value)}
            required
          />
        </label>
        <label>
          Plan for next week
          <textarea
            value={form.plan}
            onChange={(e) => updateField('plan', e.target.value)}
            required
          />
        </label>
        <label>
          Blockers (optional)
          <textarea
            value={form.blockers}
            onChange={(e) => updateField('blockers', e.target.value)}
          />
        </label>
        <div className="row">
          <button type="submit">{editingId ? 'Save changes' : 'Submit report'}</button>
          {editingId && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Filter */}
      <div className="row filter">
        <label>
          Filter by week
          <input
            type="date"
            value={filterWeek}
            onChange={(e) => setFilterWeek(e.target.value)}
          />
        </label>
        <button className="secondary" onClick={load}>
          Apply
        </button>
        {filterWeek && (
          <button
            className="secondary"
            onClick={() => {
              setFilterWeek('');
              setTimeout(load, 0);
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <p>Loading...</p>
      ) : reports.length === 0 ? (
        <p>No reports yet. Submit your first one above.</p>
      ) : (
        <div className="list">
          {reports.map((r) => (
            <div key={r._id} className="card">
              <div className="row between">
                <strong>Week of {r.weekStart}</strong>
                <span>{r.hours}h</span>
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
              {r.user?.name && (
                <p className="muted">By {r.user.name}</p>
              )}
              <div className="row">
                <button className="secondary" onClick={() => startEdit(r)}>
                  Edit
                </button>
                <button className="danger" onClick={() => handleDelete(r._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
