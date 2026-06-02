import api from './api';

export interface MessageData {
  receiverId: number;
  content: string;
}

export interface MessageResponse {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  isDelivered: boolean;
  isRead: boolean;
  createdAt: string;
  senderUsername: string;
  receiverUsername: string;
}

export interface ConversationResponse {
  userId: number;
  username: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const messageService = {
  sendMessage: async (data: MessageData): Promise<MessageResponse> => {
    const response = await api.post('/api/messages', data);
    return response.data;
  },

  getConversations: async (): Promise<ConversationResponse[]> => {
    const response = await api.get('/api/messages/conversations');
    return response.data;
  },

  getMessagesWithUser: async (otherUserId: number): Promise<MessageResponse[]> => {
    const response = await api.get(`/api/messages/with/${otherUserId}`);
    return response.data;
  },

  markAsRead: async (otherUserId: number): Promise<void> => {
    await api.put(`/api/messages/read/${otherUserId}`);
  },

  markAsDelivered: async (otherUserId: number): Promise<void> => {
    await api.put(`/api/messages/delivered/${otherUserId}`);
  },
};

export default messageService;
