import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
console.log("PipelineAI Connectivity: API_BASE is", API_BASE);

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`📡 [API SEND] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, config } = error;
    const status = response ? response.status : 'NETWORK_ERROR';
    const data = response ? response.data : 'NO_RESPONSE';
    
    console.group(`🔥 [DEBUG SIGNAL] API FAILURE`);
    console.error(`URL: ${config?.url}`);
    console.error(`STATUS: ${status}`);
    console.error(`DATA:`, data);
    console.groupEnd();
    
    return Promise.reject(error);
  }
);

export default api;
