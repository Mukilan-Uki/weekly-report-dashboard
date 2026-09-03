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

// Ask the backend if AI is configured (key present in .env).
// Pages hide their AI buttons when this is false.
export async function getAiStatus() {
  try {
    const res = await client.get('/ai/status');
    return res.data.enabled === true;
  } catch {
    return false;
  }
}
