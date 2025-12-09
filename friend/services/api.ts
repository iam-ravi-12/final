import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default API URL - can be overridden with environment variable
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://final-okus.onrender.com';

console.log('API Configuration:', {
  url: API_URL,
  envVar: process.env.EXPO_PUBLIC_API_URL,
});

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log detailed error information for debugging
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      console.error('API Error - No Response:', error.request);
      console.error('API URL:', API_URL);
    } else {
      console.error('API Error:', error.message);
    }
    
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
