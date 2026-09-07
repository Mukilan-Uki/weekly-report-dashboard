import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function Categories() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      const res = await client.get('/categories');
      setItems(res.data);
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
    try {
      if (editingId) {
        await client.put(`/categories/${editingId}`, { name, description });
        setEditingId(null);
      } else {
        await client.post('/categories', { name, description });
        setName('');
        setDescription('');
      }
      setName('');
      setDescription('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  }

  function startEdit(item) {
    setEditingId(item._id);
    setName(item.name);
    setDescription(item.description || '');
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this category?')) return;
    try {
      await client.delete(`/categories/${id}`);
      setItems((list) => list.filter((c) => c._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  }

  if (user?.role !== 'manager' && user?.role !== 'admin') {
    return <p>Only managers and admins can manage categories.</p>;
  }

  return (
    <div>
      <h2>Categories</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="card">
        <h3>{editingId ? 'Edit category' : 'New category'}</h3>
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <div className="row">
          <button type="submit">{editingId ? 'Update' : 'Create'}</button>
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

      <div className="list">
        {items.map((c) => (
          <div key={c._id} className="card row between">
            <div>
              <strong>{c.name}</strong>
              <p className="muted">{c.description}</p>
            </div>
            <div className="row">
              <button className="secondary" onClick={() => startEdit(c)}>Edit</button>
              {user?.role === 'admin' && (
                <button className="danger" onClick={() => handleDelete(c._id)}>Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
