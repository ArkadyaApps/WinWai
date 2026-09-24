import axios from 'axios';
import Constants from 'expo-constants';
import { getSecureItem } from './secureStorage';

// Get API URL from environment variables
const API_URL = 
  Constants.expoConfig?.extra?.backendUrl || 
  process.env.EXPO_PUBLIC_BACKEND_URL || 
  'http://localhost:8001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await getSecureItem('session_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ REQUEST INTERCEPTOR ERROR:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('❌ API ERROR:', error.config?.method?.toUpperCase(), error.config?.url);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    return Promise.reject(error);
  }
);

export default api;