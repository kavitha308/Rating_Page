import axios from 'axios';

// Resolve API Base URL with smart fallback and trailing slash normalization
const resolveBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl) return '/api';
  const trimmed = envUrl.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

// Create base Axios instance
const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Request Interceptor: Inject JWT token into headers if available
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

// Response Interceptor: Handle standardized response and session expiration
api.interceptors.response.use(
  (response) => {
    // Detect if SPA rewrite caught the request and returned index.html instead of backend JSON
    if (
      typeof response.data === 'string' &&
      (response.data.includes('<!DOCTYPE') || response.data.includes('<html'))
    ) {
      const err = new Error(
        'Backend connection error: The request received an HTML page instead of API JSON. Please set VITE_API_BASE_URL in your Render Frontend Environment tab (e.g. https://your-backend.onrender.com/api) and redeploy.'
      );
      err.status = 502;
      return Promise.reject(err);
    }
    return response.data;
  },
  (error) => {
    // Check for 401 Unauthorized / Token Expiration
    if (error.response && error.response.status === 401) {
      const isAuthRoute =
        window.location.pathname === '/login' ||
        window.location.pathname === '/register';

      // If session expired while on a protected route, wipe token and notify
      if (!isAuthRoute && localStorage.getItem('token')) {
        localStorage.removeItem('token');
        window.dispatchEvent(new CustomEvent('session-expired'));
      }
    }

    // Standardize error payload extraction
    const responseData = error.response?.data;
    const errorMessage =
      responseData?.message ||
      (error.message === 'Network Error'
        ? 'Cannot connect to backend server. Please check your connection.'
        : 'An unexpected error occurred. Please try again.');

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.errors = responseData?.errors || [];
    formattedError.data = responseData;

    return Promise.reject(formattedError);
  }
);

export default api;
