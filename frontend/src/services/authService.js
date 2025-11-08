import api from './api';

export const authService = {
  signup: async (username, name, email, password) => {
    const response = await api.post('/auth/signup', { username, name, email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  updateProfile: async (profession, organization, location, profilePicture = null) => {
    const requestBody = { profession, organization, location };
    if (profilePicture) {
      requestBody.profilePicture = profilePicture;
    }
    const response = await api.post('/auth/profile', requestBody);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.profileCompleted = true;
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  },

  getUserProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};
