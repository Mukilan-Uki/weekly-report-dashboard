import axios from 'axios';

// One shared axios instance for the whole app. Vite exposes only VITE_* variables.
// Local development falls back to the Vite proxy; production uses the Render API URL.
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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
