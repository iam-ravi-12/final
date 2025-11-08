import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { messageService } from '../services/messageService';
import './ChatList.css';

const ChatList = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null);
  const currentUser = authService.getCurrentUser();

  const loadConversations = useCallback(async () => {
    try {
      const data = await messageService.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [loadConversations]);

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

  const handleSelectConversation = (conversation) => {
    navigate(`/chat/${conversation.userId}`, {
      state: {
        userId: conversation.userId,
        username: conversation.username,
        profession: conversation.profession
      }
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
    <div className="chatlist-container">
      <header className="chatlist-header">
        <div className="header-content">
          <h1>Messages</h1>
          <div className="user-info">
            <button onClick={handleBackToHome} className="btn-back">
              Back to Home
            </button>
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

      <div className="chatlist-content">
        <div className="conversations-container">
          <h2>Conversations</h2>
          {conversations.length === 0 ? (
            <div className="no-conversations">
              <p>No conversations yet</p>
              <p className="hint">Click on a user's profile picture from a post to start chatting!</p>
            </div>
          ) : (
            <div className="conversations-list">
              {conversations.map((conversation) => (
                <div
                  key={conversation.userId}
                  className="conversation-item"
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <div className="conversation-avatar">
                    {conversation.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <span className="conversation-username">{conversation.username}</span>
                      {conversation.unreadCount > 0 && (
                        <span className="unread-badge">{conversation.unreadCount}</span>
                      )}
                    </div>
                    <p className="conversation-profession">{conversation.profession}</p>
                    <p className="conversation-last-message">
                      {conversation.lastMessage?.substring(0, 50)}
                      {conversation.lastMessage?.length > 50 ? '...' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatList;
