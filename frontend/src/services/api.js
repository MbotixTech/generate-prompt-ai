import axios from 'axios';

// Get API URL from environment variable, with fallback
const apiUrl = import.meta.env.VITE_API_URL;

console.log('API URL:', apiUrl); // Helpful for debugging

export const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  // Ensure cookies are sent with requests when using cross-origin requests
  withCredentials: true,
  // 10 second timeout to prevent hanging requests
  timeout: 10000,
});

// Initialize auth token from localStorage if exists
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Add a request interceptor to ensure auth header is set
api.interceptors.request.use(
  (config) => {
    // Check if token exists or has changed
    const currentToken = localStorage.getItem('token');
    if (currentToken && config.headers.Authorization !== `Bearer ${currentToken}`) {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle CORS errors
    if (error.message === 'Network Error') {
      console.error('CORS or Network Error:', error);
      // Could show a user-friendly message here
    }

    // Handle unauthorized errors (expired token, etc.)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      
      // Redirect to login page if we're in a browser environment
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    // Handle forbidden errors (often CORS issues)
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
      // Could show a user-friendly message here
    }
    
    return Promise.reject(error);
  }
);
