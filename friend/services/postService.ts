import api from './api';

export interface PostData {
  content: string;
  isHelpSection: boolean;
  mediaUrls?: string[];
}

export interface CommentData {
  content: string;
}

export interface PostResponse {
  id: number;
  content: string;
  isHelpSection: boolean;
  mediaUrls?: string[];
  userId: number;
  username: string;
  userProfession: string;
  userProfilePicture?: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentResponse {
  id: number;
  content: string;
  userId: number;
  username: string;
  userProfilePicture?: string;
  createdAt: string;
}

const postService = {
  createPost: async (data: PostData): Promise<PostResponse> => {
    const response = await api.post('/api/posts', data);
    return response.data;
  },

  getAllPosts: async (): Promise<PostResponse[]> => {
    const response = await api.get('/api/posts/all');
    return response.data;
  },

  getProfessionalPosts: async (): Promise<PostResponse[]> => {
    const response = await api.get('/api/posts/profession');
    return response.data;
  },

  getHelpPosts: async (): Promise<PostResponse[]> => {
    const response = await api.get('/api/posts/help');
    return response.data;
  },

  getPostById: async (postId: number): Promise<PostResponse> => {
    const response = await api.get(`/api/posts/${postId}`);
    return response.data;
  },

  toggleLike: async (postId: number): Promise<void> => {
    await api.post(`/api/posts/${postId}/like`);
  },

  createComment: async (postId: number, data: CommentData): Promise<CommentResponse> => {
    const response = await api.post(`/api/posts/${postId}/comments`, data);
    return response.data;
  },

  getComments: async (postId: number): Promise<CommentResponse[]> => {
    const response = await api.get(`/api/posts/${postId}/comments`);
    return response.data;
  },

  getUserPosts: async (userId: number): Promise<PostResponse[]> => {
    const response = await api.get(`/api/posts/user/${userId}`);
    return response.data;
  },

  markAsSolved: async (postId: number): Promise<void> => {
    await api.post(`/api/posts/${postId}/mark-solved`);
  },

  updatePost: async (postId: number, data: PostData): Promise<PostResponse> => {
    const response = await api.put(`/api/posts/${postId}`, data);
    return response.data;
  },

  deletePost: async (postId: number): Promise<void> => {
    await api.delete(`/api/posts/${postId}`);
  },
};

export default postService;
