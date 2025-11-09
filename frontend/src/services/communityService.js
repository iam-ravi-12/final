import api from './api';

export const communityService = {
  createCommunity: async (name, description, isPrivate, profilePicture = null) => {
    const requestBody = { name, description, isPrivate };
    if (profilePicture) {
      requestBody.profilePicture = profilePicture;
    }
    const response = await api.post('/communities', requestBody);
    return response.data;
  },

  getAllPublicCommunities: async () => {
    const response = await api.get('/communities/public');
    return response.data;
  },

  getMyCommunities: async () => {
    const response = await api.get('/communities/my');
    return response.data;
  },

  getCommunityById: async (communityId) => {
    const response = await api.get(`/communities/${communityId}`);
    return response.data;
  },

  joinCommunity: async (communityId) => {
    const response = await api.post(`/communities/${communityId}/join`);
    return response.data;
  },

  leaveCommunity: async (communityId) => {
    const response = await api.post(`/communities/${communityId}/leave`);
    return response.data;
  },

  createPost: async (communityId, content, mediaUrls = []) => {
    const response = await api.post(`/communities/${communityId}/posts`, { content, mediaUrls });
    return response.data;
  },

  getCommunityPosts: async (communityId) => {
    const response = await api.get(`/communities/${communityId}/posts`);
    return response.data;
  },

  getPendingPosts: async (communityId) => {
    const response = await api.get(`/communities/${communityId}/posts/pending`);
    return response.data;
  },

  approvePost: async (postId) => {
    const response = await api.post(`/communities/posts/${postId}/approve`);
    return response.data;
  },

  rejectPost: async (postId) => {
    const response = await api.post(`/communities/posts/${postId}/reject`);
    return response.data;
  },
};
