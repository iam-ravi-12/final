import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { messageService } from '../services/messageService';
import './Chat.css';

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams();
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

  const loadMessages = useCallback(async (uid) => {
    try {
      const data = await messageService.getMessagesWithUser(uid);
      setMessages(data);
      // Mark messages as read
      await messageService.markMessagesAsRead(uid);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    }
  }, []);

  // Load user info from route params or location state
  useEffect(() => {
    if (location.state?.userId && location.state?.username) {
      setSelectedUser({
        userId: location.state.userId,
        username: location.state.username,
        profession: location.state.profession
      });
    } else if (userId) {
      // If only userId is available, we might need to fetch user details
      // For now, just set the userId and messages will load
      setSelectedUser({
        userId: parseInt(userId),
        username: 'User',
        profession: ''
      });
    }
  }, [location.state, userId]);

  // Load messages when user is selected
  useEffect(() => {
    if (selectedUser && selectedUser.userId) {
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
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleBackToMessages = () => {
    navigate('/messages');
  };

  const handleGoToProfile = () => {
    navigate('/profile');
  };

  if (!selectedUser) {
    return (
      <div className="chat-container">
        <div className="loading-state">Loading...</div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <header className="chat-page-header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={handleBackToMessages} className="btn-back-arrow">
              ← Back to Messages
            </button>
            <h1>Chat with {selectedUser.username}</h1>
          </div>
          <div className="user-info">
            <button onClick={handleGoToProfile} className="btn-profile">
              👤 Profile
            </button>
            {profilePicture ? (
              <img src={profilePicture} alt="Profile" className="navbar-profile-pic" onClick={handleGoToProfile} />
            ) : (
              <div className="navbar-profile-placeholder" onClick={handleGoToProfile}>
                {currentUser?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="username">{currentUser?.username}</span>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="chat-content">
        <div className="chat-panel">
          <div className="chat-header">
            <div className="chat-user-info">
              <div className="chat-avatar">
                {selectedUser.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3>{selectedUser.username}</h3>
                {selectedUser.profession && <p>{selectedUser.profession}</p>}
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
        </div>
      </div>
    </div>
  );
};

export default Chat;
