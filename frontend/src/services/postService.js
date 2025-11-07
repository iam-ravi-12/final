import api from './api';

export const postService = {
  createPost: async (content, isHelpSection) => {
    const response = await api.post('/posts', { content, isHelpSection });
    return response.data;
  },

  getAllPosts: async () => {
    const response = await api.get('/posts/all');
    return response.data;
  },

  getProfessionPosts: async () => {
    const response = await api.get('/posts/profession');
    return response.data;
  },

  getHelpPosts: async () => {
    const response = await api.get('/posts/help');
    return response.data;
  },

  getPostById: async (postId) => {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  },

  toggleLike: async (postId) => {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  },

  addComment: async (postId, content) => {
    const response = await api.post(`/posts/${postId}/comments`, { content });
    return response.data;
  },

  getComments: async (postId) => {
    const response = await api.get(`/posts/${postId}/comments`);
    return response.data;
  },
};
