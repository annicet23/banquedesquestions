// --- START OF FILE frontend/src/config/api.jsx (VERSION ADAPTÉE AU PROXY) ---

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const STATIC_RESOURCES_URL = '';

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.defaults.staticBaseURL = STATIC_RESOURCES_URL;

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
