import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { messageService } from '../services/messageService';
import './Messages.css';

const Messages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const currentUser = authService.getCurrentUser();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = useCallback(async () => {
    try {
      const data = await messageService.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  }, []);

  const loadMessages = useCallback(async (userId) => {
    try {
      const data = await messageService.getMessagesWithUser(userId);
      setMessages(data);
      // Mark messages as read
      await messageService.markMessagesAsRead(userId);
      // Refresh conversations to update unread count
      loadConversations();
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    }
  }, [loadConversations]);

  // Auto-select user from navigation state (when clicking profile picture)
  useEffect(() => {
    if (location.state?.userId && location.state?.username) {
      setSelectedUser({
        userId: location.state.userId,
        username: location.state.username,
        profession: location.state.profession
      });
    }
  }, [location.state]);

  // Load conversations
  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [loadConversations]);

  // Load messages when user is selected
  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.userId);
      const interval = setInterval(() => loadMessages(selectedUser.userId), 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [selectedUser, loadMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load profile picture
  useEffect(() => {
    const loadProfilePicture = async () => {
      try {
        const profile = await authService.getUserProfile();
        if (profile.profilePicture) {
          setProfilePicture(profile.profilePicture);
        }
      } catch (err) {
        console.error('Error loading profile picture:', err);
      }
    };

    loadProfilePicture();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    setLoading(true);
    setError('');

    try {
      await messageService.sendMessage(selectedUser.userId, newMessage);
      setNewMessage('');
      await loadMessages(selectedUser.userId);
      await loadConversations();
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedUser({
      userId: conversation.userId,
      username: conversation.username,
      profession: conversation.profession
    });
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleBackToHome = () => {
    navigate('/home');
  };

  const handleGoToProfile = () => {
    navigate('/profile');
  };

  return (
    <div className="messages-wrapper">
      {/* Sidebar with Conversations */}
      <aside className="sidebar messages-sidebar">
        <div className="sidebar-header">
          <h1 className="app-logo">Friends</h1>
          <h2 style={{fontSize: '12px', color: '#9ca3af', marginTop: '4px', marginBottom: 0}}>A social Network</h2>
        </div>
        
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={handleBackToHome}>
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Back to Home</span>
          </button>
          <button className="nav-item" onClick={handleGoToProfile}>
            <span className="nav-icon">👤</span>
            <span className="nav-label">Profile</span>
          </button>
        </nav>

        {/* Conversations Section in Sidebar */}
        <div className="sidebar-conversations">
          <h3 className="conversations-title">Messages</h3>
          {conversations.length === 0 ? (
            <div className="no-conversations-sidebar">
              <p>No messages yet</p>
            </div>
          ) : (
            <div className="conversations-list-sidebar">
              {conversations.map((conversation) => (
                <div
                  key={conversation.userId}
                  className={`conversation-item-sidebar ${
                    selectedUser?.userId === conversation.userId ? 'active' : ''
                  }`}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <div className="conversation-avatar-sidebar">
                    {conversation.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="conversation-info-sidebar">
                    <div className="conversation-name-sidebar">
                      {conversation.username}
                      {conversation.unreadCount > 0 && (
                        <span className="unread-badge-sidebar">{conversation.unreadCount}</span>
                      )}
                    </div>
                    <p className="conversation-preview-sidebar">
                      {conversation.lastMessage?.substring(0, 30)}
                      {conversation.lastMessage?.length > 30 ? '...' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="user-card" onClick={handleGoToProfile}>
            {profilePicture ? (
              <img src={profilePicture} alt="Profile" className="user-avatar" />
            ) : (
              <div className="user-avatar-placeholder">
                {currentUser?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="user-details">
              <div className="user-name">{currentUser?.username}</div>
              <div className="user-profession">{currentUser?.profession || 'Professional'}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout-sidebar">
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="messages-main-content">
        <div className="chat-panel-full">
          {selectedUser ? (
            <>
              <div className="chat-header">
                <div className="chat-user-info">
                  <div className="chat-avatar">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3>{selectedUser.username}</h3>
                    <p>{selectedUser.profession}</p>
                  </div>
                </div>
              </div>

              <div className="messages-list">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`message ${
                        message.senderId === currentUser?.id ? 'sent' : 'received'
                      }`}
                    >
                      <div className="message-content">{message.content}</div>
                      <div className="message-time">
                        {new Date(message.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {error && <div className="error-message">{error}</div>}

              <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  className="message-input"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="btn-send"
                  disabled={loading || !newMessage.trim()}
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected-full">
              <p>Select a conversation from the sidebar to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
