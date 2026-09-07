import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../auth/AuthContext';

function currentWeekMonday() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

const emptyForm = {
  weekStart: currentWeekMonday(),
  done: '',
  plan: '',
  blockers: '',
  achievements: '',
  notes: '',
  hours: '',
  category: '',
};

export default function MyReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
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

  async function loadCategories() {
    try {
      const res = await client.get('/categories');
      setCategories(res.data);
    } catch {
      // non-blocking
    }
  }

  useEffect(() => {
    load();
    loadCategories();
  }, []);

  function updateField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        const res = await client.put(`/reports/${editingId}`, {
          done: form.done,
          plan: form.plan,
          blockers: form.blockers,
          achievements: form.achievements,
          notes: form.notes,
          hours: Number(form.hours),
          category: form.category || null,
        });
        setReports((list) => list.map((r) => (r._id === editingId ? res.data : r)));
        setEditingId(null);
      } else {
        const res = await client.post('/reports', {
          ...form,
          hours: Number(form.hours),
          category: form.category || null,
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
      achievements: report.achievements || '',
      notes: report.notes || '',
      hours: report.hours,
      category: report.category?._id || '',
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

  async function handleSubmitReport(id) {
    try {
      const res = await client.post(`/reports/${id}/submit`);
      setReports((list) => list.map((r) => (r._id === id ? res.data : r)));
    } catch (err) {
      setError(err.response?.data?.message || 'Submit failed');
    }
  }

  function statusBadge(status) {
    const map = {
      draft: 'badge draft',
      submitted: 'badge submitted',
      'needs-correction': 'badge correction',
      approved: 'badge approved',
    };
    return <span className={map[status] || 'badge'}>{status}</span>;
  }

  return (
    <div>
      <h2>My Weekly Reports</h2>
      {error && <p className="error">{error}</p>}

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
            Category
            <select
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
            >
              <option value="">-- none --</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
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
        <label>
          Achievements (optional)
          <textarea
            value={form.achievements}
            onChange={(e) => updateField('achievements', e.target.value)}
          />
        </label>
        <label>
          Notes / Links (optional)
          <textarea
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
          />
        </label>
        <div className="row">
          <button type="submit">{editingId ? 'Save changes' : 'Save draft'}</button>
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
                <div className="row">
                  {statusBadge(r.status)}
                  <span>{r.hours}h</span>
                </div>
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
              {r.achievements && (
                <p>
                  <strong>Achievements:</strong> {r.achievements}
                </p>
              )}
              {r.notes && (
                <p>
                  <strong>Notes:</strong> {r.notes}
                </p>
              )}
              {r.category?.name && (
                <p className="muted">Category: {r.category.name}</p>
              )}
              <div className="row">
                <button className="secondary" onClick={() => startEdit(r)}>
                  Edit
                </button>
                {(r.status === 'draft' || r.status === 'needs-correction') && (
                  <button className="secondary" onClick={() => handleSubmitReport(r._id)}>
                    Submit
                  </button>
                )}
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
