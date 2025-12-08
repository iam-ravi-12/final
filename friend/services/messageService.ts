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

  getMessagesWithUser: async (userId: number): Promise<MessageResponse[]> => {
    const response = await api.get(`/api/messages/with/${userId}`);
    return response.data;
  },

  markAsRead: async (userId: number): Promise<void> => {
    await api.put(`/api/messages/read/${userId}`);
  },
};

export default messageService;
