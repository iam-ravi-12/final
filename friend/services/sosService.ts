import api from './api';

export interface SosAlertRequest {
  latitude: number | null;
  longitude: number | null;
  locationAddress: string;
  emergencyType: 'GENERAL' | 'ACCIDENT' | 'WOMEN_SAFETY' | 'MEDICAL' | 'FIRE';
  description: string;
}

export interface SosAlertResponse {
  id: number;
  userId: number;
  username: string;
  userProfession: string;
  userProfilePicture: string | null;
  latitude: number | null;
  longitude: number | null;
  locationAddress: string;
  emergencyType: string;
  status: string;
  description: string;
  cancelledByUser: boolean;
  createdAt: string;
  resolvedAt: string | null;
  responseCount: number;
  distance: number | null;
  googleMapsUrl: string | null;
  emergencyContactNumber: string | null;
  hasCurrentUserResponded: boolean;
  currentUserResponseType: string | null;
  currentUserResponseMessage: string | null;
  isCurrentUserAlertOwner: boolean;
}

export interface SosResponseRequest {
  sosAlertId: number;
  responseType: 'ON_WAY' | 'CONTACTED_AUTHORITIES' | 'REACHED' | 'RESOLVED';
  message: string;
}

export interface SosResponseResponse {
  id: number;
  sosAlertId: number;
  responderId: number;
  responderUsername: string;
  responderProfilePicture: string | null;
  responseType: string;
  message: string;
  pointsAwarded: number;
  confirmedByAlertOwner: boolean;
  createdAt: string;
}

export interface LeaderboardResponse {
  userId: number;
  username: string;
  name: string;
  profession: string;
  profilePicture: string | null;
  leaderboardPoints: number;
  rank: number;
  badge: string | null; // GOLD, SILVER, BRONZE, or null
}

const sosService = {
  createSosAlert: async (alertData: SosAlertRequest): Promise<SosAlertResponse> => {
    const response = await api.post('/api/sos/alert', alertData);
    return response.data;
  },

  cancelSosAlert: async (alertId: number): Promise<SosAlertResponse> => {
    const response = await api.put(`/api/sos/alert/${alertId}/cancel`);
    return response.data;
  },

  getActiveAlerts: async (
    latitude?: number | null,
    longitude?: number | null,
    radiusKm: number = 50
  ): Promise<SosAlertResponse[]> => {
    const params: any = {};
    if (latitude && longitude) {
      params.latitude = latitude;
      params.longitude = longitude;
      params.radiusKm = radiusKm;
    }
    const response = await api.get('/api/sos/alerts/active', { params });
    return response.data;
  },

  getUserAlerts: async (): Promise<SosAlertResponse[]> => {
    const response = await api.get('/api/sos/alerts/user');
    return response.data;
  },

  getAlertById: async (
    alertId: number,
    latitude?: number | null,
    longitude?: number | null
  ): Promise<SosAlertResponse> => {
    const params: any = {};
    if (latitude && longitude) {
      params.latitude = latitude;
      params.longitude = longitude;
    }
    const response = await api.get(`/api/sos/alert/${alertId}`, { params });
    return response.data;
  },

  respondToAlert: async (responseData: SosResponseRequest): Promise<SosResponseResponse> => {
    const response = await api.post('/api/sos/respond', responseData);
    return response.data;
  },

  getAlertResponses: async (alertId: number): Promise<SosResponseResponse[]> => {
    const response = await api.get(`/api/sos/alert/${alertId}/responses`);
    return response.data;
  },

  getUserResponses: async (): Promise<SosResponseResponse[]> => {
    const response = await api.get('/api/sos/responses/user');
    return response.data;
  },

  getLeaderboard: async (limit: number = 50): Promise<LeaderboardResponse[]> => {
    const response = await api.get('/api/sos/leaderboard', { params: { limit } });
    return response.data;
  },

  confirmHelpReceived: async (responseId: number): Promise<SosResponseResponse> => {
    const response = await api.put(`/api/sos/response/${responseId}/confirm`);
    return response.data;
  },
};

export default sosService;
