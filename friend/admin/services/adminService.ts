import api from '@/services/api';

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalCommunities: number;
  totalMessages: number;
  totalSosAlerts: number;
  totalReports: number;
  totalBannedUsers: number;
}

export interface AdminUser {
  id: number;
  username: string;
  name: string;
  email: string;
  profession: string;
  profilePicture: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'BANNED' | 'DELETED';
  createdAt: string;
}

export interface AdminReport {
  id: number;
  reporterId: number;
  reporterName: string;
  reportedUserId?: number;
  reportedUserName?: string;
  reportedPostId?: number;
  reportedPostContent?: string;
  reportedCommunityId?: number;
  reportedCommunityName?: string;
  reason: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED';
  createdAt: string;
}

export interface AdminCommunity {
  id: number;
  name: string;
  description: string;
  isPrivate: boolean;
  profilePicture?: string;
  adminId: number;
  adminUsername: string;
  memberCount: number;
  createdAt: string;
}

export interface AdminCommunityPost {
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

export interface AdminPost {
  id: number;
  content: string;
  mediaUrls?: string[];
  userId: number;
  username: string;
  userProfession?: string;
  userProfilePicture?: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  reportCount?: number; // Optional, mapping custom frontend calculations or backend annotations
}

const adminService = {
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getUsers: async (params?: {
    search?: string;
    profession?: string;
    role?: 'USER' | 'ADMIN';
    page?: number;
    size?: number;
  }): Promise<{ content: AdminUser[]; totalPages: number; totalElements: number }> => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  banUser: async (id: number, reason: string): Promise<string> => {
    const response = await api.put(`/admin/users/${id}/ban`, { reason });
    return response.data;
  },

  unbanUser: async (id: number): Promise<string> => {
    const response = await api.put(`/admin/users/${id}/unban`);
    return response.data;
  },

  deleteUser: async (id: number): Promise<string> => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  forceDeletePost: async (id: number): Promise<string> => {
    const response = await api.delete(`/admin/posts/${id}`);
    return response.data;
  },

  deleteCommunity: async (id: number): Promise<string> => {
    const response = await api.delete(`/admin/community/${id}`);
    return response.data;
  },

  deleteCommunityPost: async (id: number): Promise<string> => {
    const response = await api.delete(`/admin/community/post/${id}`);
    return response.data;
  },

  getReports: async (params?: {
    status?: 'PENDING' | 'REVIEWED' | 'RESOLVED';
    page?: number;
    size?: number;
  }): Promise<{ content: AdminReport[]; totalPages: number; totalElements: number }> => {
    const response = await api.get('/admin/reports', { params });
    return response.data;
  },
};

export default adminService;
