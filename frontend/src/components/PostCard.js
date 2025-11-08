import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';
import { authService } from '../services/authService';
import { postService } from '../services/postService';
import './PostCard.css';

const PostCard = ({ post, onPostUpdate }) => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [isLiked, setIsLiked] = useState(post.likedByCurrentUser);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isLiking, setIsLiking] = useState(false);

  const handleProfileClick = () => {
    // Don't allow messaging yourself
    if (post.userId === currentUser?.id) {
      return;
    }
    
    navigate(`/chat/${post.userId}`, {
      state: {
        userId: post.userId,
        username: post.username,
        profession: post.userProfession
      }
    });
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (isLiking) return;

    setIsLiking(true);
    try {
      await postService.toggleLike(post.id);
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
      if (onPostUpdate) onPostUpdate();
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentClick = (e) => {
    e.stopPropagation();
    navigate(`/post/${post.id}`);
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
            {post.userProfilePicture ? (
              <img src={post.userProfilePicture} alt={post.username} className="post-avatar-img" />
            ) : (
              post.username.charAt(0).toUpperCase()
            )}
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

      <div className="post-actions">
        <button 
          className={`action-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={isLiking}
        >
          <span className="action-icon">{isLiked ? '❤️' : '🤍'}</span>
          <span className="action-count">{likeCount}</span>
        </button>
        <button 
          className="action-btn"
          onClick={handleCommentClick}
        >
          <span className="action-icon">💬</span>
          <span className="action-count">{post.commentCount}</span>
        </button>
      </div>
    </div>
  );
};

export default PostCard;
