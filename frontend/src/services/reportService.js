import api from './api';

export const reportService = {
  submitReport: async (reason, targets) => {
    const { reportedPostId, reportedUserId, reportedCommunityId, reportedCommunityPostId } = targets;
    const response = await api.post('/reports', {
      reason,
      reportedPostId,
      reportedUserId,
      reportedCommunityId,
      reportedCommunityPostId,
    });
    return response.data;
  },
};
