import api from './api';

export const messageService = {
  // Send a message
  sendMessage: async (receiverId, content) => {
    try {
      const response = await api.post('/messages', {
        receiverId,
        content
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Get all conversations
  getConversations: async () => {
    try {
      console.log('Fetching conversations from API...');
      const response = await api.get('/messages/conversations');
      console.log('Conversations API response:', response);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      console.error('Error response:', error.response);
      throw error;
    }
  },

  // Get messages with a specific user
  getMessagesWithUser: async (userId) => {
    try {
      const response = await api.get(`/messages/with/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Mark messages as read
  markMessagesAsRead: async (userId) => {
    try {
      await api.put(`/messages/read/${userId}`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }
};
