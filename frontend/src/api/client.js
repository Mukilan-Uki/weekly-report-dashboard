import axios from 'axios';

// One shared axios instance for the whole app.
// baseURL '/api' works locally AND in preview because vite proxies /api -> backend.
const client = axios.create({
  baseURL: '/api',
});

// Every request automatically carries the JWT (if logged in).
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
