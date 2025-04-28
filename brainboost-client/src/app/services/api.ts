import axios from 'axios';

// API base URL from environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors (401)
    if (error.response?.status === 401) {
      // Check if error is due to expired token (vs invalid credentials)
      if (error.response?.data?.message === 'Token expired') {
        // Clear local authentication
        localStorage.removeItem('token');
        // Redirect to login
        window.location.href = '/login?session=expired';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
