import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      const [projectsRes, usersRes] = await Promise.all([
        client.get('/projects'),
        client.get('/auth/users'),
      ]);
      setProjects(projectsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects');
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
        await client.put(`/projects/${editingId}`, {
          name,
          description,
          members: selectedMembers,
        });
        setEditingId(null);
      } else {
        await client.post('/projects', {
          name,
          description,
          members: selectedMembers,
        });
        setName('');
        setDescription('');
        setSelectedMembers([]);
      }
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  }

  function startEdit(project) {
    setEditingId(project._id);
    setName(project.name);
    setDescription(project.description || '');
    setSelectedMembers(project.members?.map((m) => m._id) || []);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this project?')) return;
    try {
      await client.delete(`/projects/${id}`);
      setProjects((list) => list.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  }

  function toggleMember(userId) {
    setSelectedMembers((list) =>
      list.includes(userId) ? list.filter((id) => id !== userId) : [...list, userId]
    );
  }

  if (user?.role !== 'manager' && user?.role !== 'admin') {
    return <p>Only managers and admins can manage projects.</p>;
  }

  return (
    <div>
      <h2>Projects</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="card">
        <h3>{editingId ? 'Edit project' : 'New project'}</h3>
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
        <label>
          Members
          <div className="checkbox-list">
            {users.map((u) => (
              <label key={u._id} className="checkbox">
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(u._id)}
                  onChange={() => toggleMember(u._id)}
                />
                {u.name} ({u.role})
              </label>
            ))}
          </div>
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
                setSelectedMembers([]);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="list">
        {projects.map((p) => (
          <div key={p._id} className="card row between">
            <div>
              <strong>{p.name}</strong>
              <p className="muted">{p.description}</p>
              <p className="muted">
                Members: {p.members?.map((m) => m.name).join(', ') || 'None'}
              </p>
            </div>
            <div className="row">
              <button className="secondary" onClick={() => startEdit(p)}>Edit</button>
              {user?.role === 'admin' && (
                <button className="danger" onClick={() => handleDelete(p._id)}>Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
