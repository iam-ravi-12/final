import api from './api';

const sosService = {
  createSosAlert: async (alertData) => {
    try {
      const response = await api.post('/sos/alert', alertData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  cancelSosAlert: async (alertId) => {
    try {
      const response = await api.put(`/sos/alert/${alertId}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getActiveAlerts: async (latitude, longitude, radiusKm = 50) => {
    try {
      const params = {};
      if (latitude && longitude) {
        params.latitude = latitude;
        params.longitude = longitude;
        params.radiusKm = radiusKm;
      }
      const response = await api.get('/sos/alerts/active', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getUserAlerts: async () => {
    try {
      const response = await api.get('/sos/alerts/user');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAlertById: async (alertId, latitude, longitude) => {
    try {
      const params = {};
      if (latitude && longitude) {
        params.latitude = latitude;
        params.longitude = longitude;
      }
      const response = await api.get(`/sos/alert/${alertId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  respondToAlert: async (responseData) => {
    try {
      const response = await api.post('/sos/respond', responseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAlertResponses: async (alertId) => {
    try {
      const response = await api.get(`/sos/alert/${alertId}/responses`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getUserResponses: async () => {
    try {
      const response = await api.get('/sos/responses/user');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getLeaderboard: async (limit = 50) => {
    try {
      const response = await api.get('/sos/leaderboard', { params: { limit } });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  confirmHelpReceived: async (responseId) => {
    try {
      const response = await api.put(`/sos/response/${responseId}/confirm`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export { sosService };
