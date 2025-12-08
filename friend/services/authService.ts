import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SignupData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface ProfileData {
  profession: string;
  organization: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
  profileCompleted: boolean;
  profession?: string;
  organization?: string;
}

export interface ProfileResponse {
  id: number;
  username: string;
  email: string;
  profession: string;
  organization: string;
  profileCompleted: boolean;
}

const authService = {
  signup: async (data: SignupData): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/signup', data);
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/login', data);
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  updateProfile: async (data: ProfileData): Promise<void> => {
    const response = await api.post('/api/auth/profile', data);
    // Update stored user data
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      user.profession = data.profession;
      user.organization = data.organization;
      user.profileCompleted = true;
      await AsyncStorage.setItem('user', JSON.stringify(user));
    }
    return response.data;
  },

  getProfile: async (): Promise<ProfileResponse> => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },

  getUserProfile: async (userId: number): Promise<ProfileResponse> => {
    const response = await api.get(`/api/auth/profile/${userId}`);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },

  getCurrentUser: async (): Promise<AuthResponse | null> => {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  },
};

export default authService;
