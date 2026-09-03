import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import StatusBadge from '../components/StatusBadge';

// Monday of current week as yyyy-mm-dd (matches backend weekStart format).
function currentWeekMonday() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

const emptyForm = {
  weekStart: currentWeekMonday(),
  category: '',
  done: '',
  plan: '',
  blockers: '',
  hours: '',
};

// Page 2: Personal weekly report page.
// Create/edit form with fixed structure + my reports with Submit buttons.
export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      const res = await client.get(`/reports?${params.toString()}`);
      setReports(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    client.get('/categories').then((res) => setCategories(res.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  // Basic client-side validation before sending to the backend.
  function valid() {
    if (!form.weekStart || !form.done.trim() || !form.plan.trim()) {
      setError('Week, Done and Plan are required');
      return false;
    }
    const h = Number(form.hours);
    if (form.hours === '' || isNaN(h) || h < 0 || h > 168) {
      setError('Hours must be a number between 0 and 168');
      return false;
    }
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!valid()) return;
    try {
      const payload = {
        done: form.done,
        plan: form.plan,
        blockers: form.blockers,
        hours: Number(form.hours),
        category: form.category || null,
      };
      if (editingId) {
        const res = await client.put(`/reports/${editingId}`, payload);
        setReports((list) => list.map((r) => (r._id === editingId ? res.data : r)));
        setEditingId(null);
      } else {
        const res = await client.post('/reports', { ...payload, weekStart: form.weekStart });
        setReports((list) => [res.data, ...list]);
      }
      setForm({ ...emptyForm, weekStart: currentWeekMonday() });
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  }

  function startEdit(report) {
    setEditingId(report._id);
    setForm({
      weekStart: report.weekStart,
      category: report.category?._id || '',
      done: report.done,
      plan: report.plan,
      blockers: report.blockers || '',
      hours: report.hours,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSend(id) {
    setError('');
    try {
      const res = await client.post(`/reports/${id}/submit`);
      setReports((list) => list.map((r) => (r._id === id ? res.data : r)));
    } catch (err) {
      setError(err.response?.data?.message || 'Submit failed');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this draft report?')) return;
    try {
      await client.delete(`/reports/${id}`);
      setReports((list) => list.filter((r) => r._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  }

  const canEdit = (r) => r.status === 'draft' || r.status === 'needs-correction';

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
            Hours (0–168)
            <input
              type="number"
              min="0"
              max="168"
              value={form.hours}
              onChange={(e) => updateField('hours', e.target.value)}
              required
            />
          </label>
          <label>
            Category
            <select value={form.category} onChange={(e) => updateField('category', e.target.value)}>
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Done this week
          <textarea value={form.done} onChange={(e) => updateField('done', e.target.value)} required />
        </label>
        <label>
          Plan for next week
          <textarea value={form.plan} onChange={(e) => updateField('plan', e.target.value)} required />
        </label>
        <label>
          Blockers (optional)
          <textarea value={form.blockers} onChange={(e) => updateField('blockers', e.target.value)} />
        </label>
        <div className="row">
          <button type="submit">{editingId ? 'Save changes' : 'Save as draft'}</button>
          {editingId && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setEditingId(null);
                setForm({ ...emptyForm, weekStart: currentWeekMonday() });
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
          Filter by status
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="needs-correction">Needs Correction</option>
            <option value="approved">Approved</option>
          </select>
        </label>
        <button className="secondary" onClick={load}>
          Apply
        </button>
      </div>

      {/* List */}
      {loading ? (
        <p>Loading...</p>
      ) : reports.length === 0 ? (
        <p>No reports yet. Save your first draft above.</p>
      ) : (
        <div className="list">
          {reports.map((r) => (
            <div key={r._id} className="card">
              <div className="row between">
                <strong>Week of {r.weekStart}</strong>
                <StatusBadge status={r.status} />
              </div>
              <p>
                <strong>Done:</strong> {r.done}
              </p>
              <p>
                <strong>Plan:</strong> {r.plan}
              </p>
              {r.category?.name && <p className="muted">Category: {r.category.name}</p>}
              {r.comments?.length > 0 && (
                <p className="muted">Manager feedback: {r.comments[r.comments.length - 1].text}</p>
              )}
              <div className="row">
                <Link to={`/reports/${r._id}`}>View</Link>
                {canEdit(r) && (
                  <>
                    <button className="secondary" onClick={() => startEdit(r)}>
                      Edit
                    </button>
                    <button onClick={() => handleSend(r._id)}>Submit for review</button>
                    <button className="danger" onClick={() => handleDelete(r._id)}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
