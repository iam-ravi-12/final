import api from './api';

export interface CommunityResponse {
  id: number;
  name: string;
  description: string;
  isPrivate: boolean;
  profilePicture?: string;
  adminId: number;
  adminUsername: string;
  memberCount: number;
  isMember: boolean;
  isAdmin: boolean;
  createdAt: string;
}

export interface CommunityPostResponse {
  id: number;
  content: string;
  mediaUrls?: string[];
  communityId: number;
  communityName: string;
  userId: number;
  username: string;
  userProfilePicture?: string;
  isApproved: boolean;
  createdAt: string;
}

export interface CommunityRequest {
  name: string;
  description: string;
  isPrivate: boolean;
  profilePicture?: string;
}

export interface CommunityPostRequest {
  content: string;
  mediaUrls?: string[];
}

const communityService = {
  // Get all public communities
  getPublicCommunities: async (): Promise<CommunityResponse[]> => {
    const response = await api.get<CommunityResponse[]>('/communities/public');
    return response.data;
  },

  // Get user's communities (communities they've joined)
  getMyCommunities: async (): Promise<CommunityResponse[]> => {
    const response = await api.get<CommunityResponse[]>('/communities/my');
    return response.data;
  },

  // Get community by ID
  getCommunityById: async (communityId: number): Promise<CommunityResponse> => {
    const response = await api.get<CommunityResponse>(`/communities/${communityId}`);
    return response.data;
  },

  // Join a community
  joinCommunity: async (communityId: number): Promise<void> => {
    await api.post(`/communities/${communityId}/join`);
  },

  // Leave a community
  leaveCommunity: async (communityId: number): Promise<void> => {
    await api.post(`/communities/${communityId}/leave`);
  },

  // Get posts in a community
  getCommunityPosts: async (communityId: number): Promise<CommunityPostResponse[]> => {
    const response = await api.get<CommunityPostResponse[]>(`/communities/${communityId}/posts`);
    return response.data;
  },

  // Create a post in a community
  createCommunityPost: async (communityId: number, data: CommunityPostRequest): Promise<CommunityPostResponse> => {
    const response = await api.post<CommunityPostResponse>(`/communities/${communityId}/posts`, data);
    return response.data;
  },

  // Create a new community
  createCommunity: async (data: CommunityRequest): Promise<CommunityResponse> => {
    const response = await api.post<CommunityResponse>('/communities', data);
    return response.data;
  },
};

export default communityService;
