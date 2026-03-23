import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for standardized error handling
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || 'An unexpected error occurred';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

export default client;
