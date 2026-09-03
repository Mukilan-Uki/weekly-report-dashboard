import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../auth/AuthContext';

// Page 6: Project/category management (CRUD).
// Managers + admins can create/edit. Only ADMINS can delete (backend enforces too).
export default function Categories() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      const res = await client.get('/categories');
      setCategories(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load categories');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    try {
      if (editingId) {
        const res = await client.put(`/categories/${editingId}`, { name, description });
        setCategories((list) => list.map((c) => (c._id === editingId ? res.data : c)));
        setEditingId(null);
      } else {
        const res = await client.post('/categories', { name, description });
        setCategories((list) => [...list, res.data]);
      }
      setName('');
      setDescription('');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  }

  function startEdit(c) {
    setEditingId(c._id);
    setName(c.name);
    setDescription(c.description || '');
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this category?')) return;
    try {
      await client.delete(`/categories/${id}`);
      setCategories((list) => list.filter((c) => c._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  }

  return (
    <div>
      <h2>Categories</h2>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit} className="card">
        <h3>{editingId ? 'Edit category' : 'New category'}</h3>
        <div className="row">
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Description
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
        </div>
        <div className="row">
          <button type="submit">{editingId ? 'Save' : 'Add'}</button>
          {editingId && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setEditingId(null);
                setName('');
                setDescription('');
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td>{c.description}</td>
                <td>
                  <div className="row">
                    <button className="secondary" onClick={() => startEdit(c)}>
                      Edit
                    </button>
                    {isAdmin && (
                      <button className="danger" onClick={() => handleDelete(c._id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isAdmin && (
          <p className="muted">Only admins can delete categories — managers can add and edit.</p>
        )}
      </div>
    </div>
  );
}
