import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 
  (window.location.hostname.includes('vercel.app') ? 'https://pipeline-backend.onrender.com' : 'http://127.0.0.1:8000');

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
