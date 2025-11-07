import React from 'react';
import { formatDate } from '../utils/dateUtils';
import './PostCard.css';

const PostCard = ({ post }) => {
  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-user-info">
          <div className="post-avatar">
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
