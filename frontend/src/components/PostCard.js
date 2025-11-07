import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';
import { authService } from '../services/authService';
import './PostCard.css';

const PostCard = ({ post }) => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const handleProfileClick = () => {
    // Don't allow messaging yourself
    if (post.userId === currentUser?.id) {
      return;
    }
    
    navigate('/messages', {
      state: {
        userId: post.userId,
        username: post.username,
        profession: post.userProfession
      }
    });
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-user-info">
          <div 
            className="post-avatar" 
            onClick={handleProfileClick}
            style={{ cursor: post.userId !== currentUser?.id ? 'pointer' : 'default' }}
            title={post.userId !== currentUser?.id ? 'Click to message' : ''}
          >
            {post.username.charAt(0).toUpperCase()}
          </div>
          <div className="post-details">
            <h4 className="post-username">{post.username}</h4>
            <p className="post-profession">{post.userProfession}</p>
          </div>
        </div>
        <div className="post-time">
          {formatDate(post.createdAt)}
        </div>
      </div>
      
      <div className="post-content">
        <p>{post.content}</p>
      </div>
      
      {post.isHelpSection && (
        <div className="post-badge">
          <span className="help-badge">Help Request</span>
        </div>
      )}
    </div>
  );
};

export default PostCard;
