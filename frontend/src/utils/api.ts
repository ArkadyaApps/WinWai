import axios from 'axios';
import Constants from 'expo-constants';
import { getSecureItem } from './secureStorage';

// Get API URL from environment variables
const API_URL = 
  Constants.expoConfig?.extra?.backendUrl || 
  process.env.EXPO_PUBLIC_BACKEND_URL || 
  'http://localhost:8001';

console.log('==================== API CLIENT INIT ====================');
console.log('API_URL configured as:', API_URL);
console.log('Constants.expoConfig?.extra?.backendUrl:', Constants.expoConfig?.extra?.backendUrl);
console.log('process.env.EXPO_PUBLIC_BACKEND_URL:', process.env.EXPO_PUBLIC_BACKEND_URL);
console.log('=========================================================');

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
    console.log('🔵 API REQUEST:', config.method?.toUpperCase(), config.url);
    console.log('🔵 Full URL:', (config.baseURL ?? '') + (config.url ?? ''));
    const token = await getSecureItem('session_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token added to request');
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
    console.log('✅ API RESPONSE:', response.config.method?.toUpperCase(), response.config.url, 'Status:', response.status);
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