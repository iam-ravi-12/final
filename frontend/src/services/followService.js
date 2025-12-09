import api from './api';

export const followService = {
  sendFollowRequest: async (userId) => {
    const response = await api.post(`/follows/send/${userId}`);
    return response.data;
  },

  acceptFollowRequest: async (followId) => {
    const response = await api.post(`/follows/accept/${followId}`);
    return response.data;
  },

  rejectFollowRequest: async (followId) => {
    const response = await api.post(`/follows/reject/${followId}`);
    return response.data;
  },

  unfollow: async (userId) => {
    const response = await api.delete(`/follows/unfollow/${userId}`);
    return response.data;
  },

  getFollowers: async (userId) => {
    const response = await api.get(`/follows/followers/${userId}`);
    return response.data;
  },

  getFollowing: async (userId) => {
    const response = await api.get(`/follows/following/${userId}`);
    return response.data;
  },

  getPendingRequests: async () => {
    const response = await api.get('/follows/pending');
    return response.data;
  },

  getFollowStats: async (userId) => {
    const response = await api.get(`/follows/stats/${userId}`);
    return response.data;
  },
};
