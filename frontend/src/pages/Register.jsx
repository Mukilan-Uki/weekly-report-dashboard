import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Register() {
  const [name, setName] = useState(''); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [role, setRole] = useState('member');
  const [error, setError] = useState(''); const { register } = useAuth(); const navigate = useNavigate();
  async function handleSubmit(event) {
    event.preventDefault(); setError('');
    try { await register(name, email, password, role); navigate('/reports'); }
    catch (err) { setError(err.response?.data?.message || 'Register failed'); }
  }
  return <div className="card"><h2>Register</h2>{error && <p className="error">{error}</p>}<form onSubmit={handleSubmit}><label>Name<input value={name} onChange={(e) => setName(e.target.value)} required /></label><label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label><label>Role<select value={role} onChange={(e) => setRole(e.target.value)}><option value="member">Member</option><option value="manager">Manager</option></select></label><button type="submit">Create account</button></form><p>Have an account? <Link to="/login">Login</Link></p></div>;
}
