import { useEffect, useState } from 'react';
import client from '../api/client';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await client.get('/auth/users');
        setUsers(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load users');
      }
    }
    load();
  }, []);

  async function handleRoleChange(id, newRole) {
    try {
      await client.put(`/auth/users/${id}`, { role: newRole });
      setUsers((list) => list.map((u) => (u._id === id ? { ...u, role: newRole } : u)));
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  }

  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <h2>User Management</h2>
      <div className="list">
        {users.map((u) => (
          <div key={u._id} className="card row between">
            <div>
              <strong>{u.name}</strong>
              <p className="muted">{u.email}</p>
            </div>
            <div className="row">
              <select
                value={u.role}
                onChange={(e) => handleRoleChange(u._id, e.target.value)}
              >
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
