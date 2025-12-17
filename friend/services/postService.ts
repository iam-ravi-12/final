import api from './api';

export interface PostData {
  content: string;
  isHelpSection: boolean;
  showInHome?: boolean;
  mediaUrls?: string[];
}

export interface CommentData {
  content: string;
}

export interface PostResponse {
  id: number;
  content: string;
  isHelpSection: boolean;
  isSolved: boolean;
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
  uploadImages: async (imageUris: string[]): Promise<string[]> => {
    try {
      const formData = new FormData();
      
      for (let i = 0; i < imageUris.length; i++) {
        const uri = imageUris[i];
        
        // Extract filename and determine file type
        const uriParts = uri.split('/');
        const filename = uriParts[uriParts.length - 1];
        
        // Determine MIME type from file extension or default to JPEG
        let mimeType = 'image/jpeg';
        if (filename.toLowerCase().endsWith('.png')) {
          mimeType = 'image/png';
        } else if (filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')) {
          mimeType = 'image/jpeg';
        } else if (filename.toLowerCase().endsWith('.gif')) {
          mimeType = 'image/gif';
        }
        
        // Create file object for React Native FormData
        const fileObject: any = {
          uri: uri,
          type: mimeType,
          name: filename || `image_${Date.now()}_${i}.jpg`,
        };
        
        console.log('Appending file to FormData:', fileObject);
        formData.append('files', fileObject);
      }

      console.log('Uploading', imageUris.length, 'image(s) to server...');
      
      // Don't set Content-Type header - let React Native/axios handle it
      // for multipart/form-data with proper boundary
      const config = {
        // Increase timeout for image uploads
        timeout: 60000, // 60 seconds
      };
      
      const response = await api.post('/api/upload/images', formData, config);
      
      console.log('Upload successful:', response.data);
      
      if (!response.data.urls || response.data.urls.length === 0) {
        throw new Error('No URLs returned from server');
      }
      
      return response.data.urls;
    } catch (error: any) {
      console.error('Error uploading images:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
        console.error('Status code:', error.response.status);
      }
      throw error;
    }
  },

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
