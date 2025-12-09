import api from './api';

export interface FollowResponse {
  id: number;
  followerId: number;
  followingId: number;
  followerUsername: string;
  followingUsername: string;
  status: string;
  createdAt: string;
}

export interface FollowStatsResponse {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  followStatus: string;
}

const followService = {
  sendFollowRequest: async (userId: number): Promise<void> => {
    await api.post(`/api/follows/send/${userId}`);
  },

  acceptFollowRequest: async (followId: number): Promise<void> => {
    await api.post(`/api/follows/accept/${followId}`);
  },

  rejectFollowRequest: async (followId: number): Promise<void> => {
    await api.post(`/api/follows/reject/${followId}`);
  },

  unfollow: async (userId: number): Promise<void> => {
    await api.delete(`/api/follows/unfollow/${userId}`);
  },

  getFollowers: async (userId: number): Promise<FollowResponse[]> => {
    const response = await api.get(`/api/follows/followers/${userId}`);
    return response.data;
  },

  getFollowing: async (userId: number): Promise<FollowResponse[]> => {
    const response = await api.get(`/api/follows/following/${userId}`);
    return response.data;
  },

  getPendingRequests: async (): Promise<FollowResponse[]> => {
    const response = await api.get('/api/follows/pending');
    return response.data;
  },

  getFollowStats: async (userId: number): Promise<FollowStatsResponse> => {
    const response = await api.get(`/api/follows/stats/${userId}`);
    return response.data;
  },
};

export default followService;
