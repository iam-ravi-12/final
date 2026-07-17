import api from './api';

export interface ReportRequest {
  reason: string;
  reportedPostId?: number;
  reportedUserId?: number;
  reportedCommunityId?: number;
  reportedCommunityPostId?: number;
}

export interface ReportResponseData {
  id: number;
  reporterId: number;
  reporterName: string;
  reason: string;
  status: string;
  createdAt: string;
}

const reportService = {
  reportPost: async (postId: number, reason: string): Promise<ReportResponseData> => {
    const response = await api.post('/api/reports', {
      reason,
      reportedPostId: postId,
    });
    return response.data;
  },

  reportUser: async (userId: number, reason: string): Promise<ReportResponseData> => {
    const response = await api.post('/api/reports', {
      reason,
      reportedUserId: userId,
    });
    return response.data;
  },

  reportCommunity: async (communityId: number, reason: string): Promise<ReportResponseData> => {
    const response = await api.post('/api/reports', {
      reason,
      reportedCommunityId: communityId,
    });
    return response.data;
  },

  reportCommunityPost: async (communityPostId: number, reason: string): Promise<ReportResponseData> => {
    const response = await api.post('/api/reports', {
      reason,
      reportedCommunityPostId: communityPostId,
    });
    return response.data;
  },
};

export default reportService;
