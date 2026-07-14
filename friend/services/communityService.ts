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

export interface CommunityMemberResponse {
  id: number;
  userId: number;
  username: string;
  name?: string;
  profilePicture?: string;
  profession?: string;
  joinedAt: string;
  isAdmin: boolean;
}

const communityService = {
  // Get all public communities
  getPublicCommunities: async (): Promise<CommunityResponse[]> => {
    const response = await api.get<CommunityResponse[]>('/api/communities/public');
    return response.data;
  },

  // Get user's communities (communities they've joined)
  getMyCommunities: async (): Promise<CommunityResponse[]> => {
    const response = await api.get<CommunityResponse[]>('/api/communities/my');
    return response.data;
  },

  // Get community by ID
  getCommunityById: async (communityId: number): Promise<CommunityResponse> => {
    const response = await api.get<CommunityResponse>(`/api/communities/${communityId}`);
    return response.data;
  },

  // Join a community
  joinCommunity: async (communityId: number): Promise<void> => {
    await api.post(`/api/communities/${communityId}/join`);
  },

  // Leave a community
  leaveCommunity: async (communityId: number): Promise<void> => {
    await api.post(`/api/communities/${communityId}/leave`);
  },

  // Get posts in a community
  getCommunityPosts: async (communityId: number): Promise<CommunityPostResponse[]> => {
    const response = await api.get<CommunityPostResponse[]>(`/api/communities/${communityId}/posts`);
    return response.data;
  },

  // Create a post in a community
  createCommunityPost: async (communityId: number, data: CommunityPostRequest): Promise<CommunityPostResponse> => {
    const response = await api.post<CommunityPostResponse>(`/api/communities/${communityId}/posts`, data);
    return response.data;
  },

  // Create a new community
  createCommunity: async (data: CommunityRequest): Promise<CommunityResponse> => {
    const response = await api.post<CommunityResponse>('/api/communities', data);
    return response.data;
  },

  // Get pending posts (admin only)
  getPendingPosts: async (communityId: number): Promise<CommunityPostResponse[]> => {
    const response = await api.get<CommunityPostResponse[]>(`/api/communities/${communityId}/posts/pending`);
    return response.data;
  },

  // Approve a post (admin only)
  approvePost: async (postId: number): Promise<void> => {
    await api.post(`/api/communities/posts/${postId}/approve`);
  },

  // Reject a post (admin only)
  rejectPost: async (postId: number): Promise<void> => {
    await api.post(`/api/communities/posts/${postId}/reject`);
  },

  // Get community members (admin only)
  getCommunityMembers: async (communityId: number): Promise<CommunityMemberResponse[]> => {
    const response = await api.get<CommunityMemberResponse[]>(`/api/communities/${communityId}/members`);
    return response.data;
  },

  // Remove a member from community (admin only)
  removeMember: async (communityId: number, userId: number): Promise<void> => {
    await api.delete(`/api/communities/${communityId}/members/${userId}`);
  },
};

export default communityService;
