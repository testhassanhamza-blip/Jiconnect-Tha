// frontend/src/api.js
import axios from 'axios';

// Permet de définir l'API en prod via variable d'env Vercel/Netlify
// Ex: REACT_APP_API_BASE=https://jiconnect-back.onrender.com/api
const BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001/api';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const t = localStorage.getItem('token');
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
