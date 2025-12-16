import api from './api';

export const adminService = {
  // Admin login
  login: async (username, password) => {
    const response = await api.post('/admin/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('isAdmin', 'true');
    }
    return response.data;
  },

  // Check if admin is logged in
  isAdminLoggedIn: () => {
    return localStorage.getItem('isAdmin') === 'true' && localStorage.getItem('adminToken') !== null;
  },

  // Logout admin
  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('isAdmin');
  },

  // Get all users
  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  // Get total posts count
  getPostsCount: async () => {
    const response = await api.get('/admin/posts/count');
    return response.data;
  },

  // Get all posts
  getAllPosts: async () => {
    const response = await api.get('/admin/posts');
    return response.data;
  },

  // Get all communities
  getAllCommunities: async () => {
    const response = await api.get('/admin/communities');
    return response.data;
  },

  // Get community members
  getCommunityMembers: async (communityId) => {
    const response = await api.get(`/admin/communities/${communityId}/members`);
    return response.data;
  },

  // Get all SOS requests
  getAllSosRequests: async () => {
    const response = await api.get('/admin/sos');
    return response.data;
  },

  // Get SOS responses
  getSosResponses: async (sosId) => {
    const response = await api.get(`/admin/sos/${sosId}/responses`);
    return response.data;
  },
};
