import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';

// Auth state shared by all pages: { user, login, register, logout, loading }
// Same pattern you used in SplitNest: Context + localStorage token.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On page reload: if token exists, ask backend "who am I?"
  useEffect(() => {
    async function restore() {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await client.get('/auth/me');
        setUser(res.data);
      } catch {
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    restore();
  }, []);

  async function login(email, password) {
    const res = await client.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  async function register(name, email, password, role) {
    const res = await client.post('/auth/register', { name, email, password, role });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
