import React, { useState } from 'react';
import { postService } from '../services/postService';
import './CreatePost.css';

const CreatePost = ({ onPostCreated, onCancel, isHelpSection }) => {
  const [content, setContent] = useState('');
  const [isHelp, setIsHelp] = useState(isHelpSection || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Post content cannot be empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await postService.createPost(content, isHelp);
      setContent('');
      onPostCreated();
    } catch (err) {
      setError(err.response?.data || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-card">
      <h3>Create a Post</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <textarea
          className="post-textarea"
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows="4"
          disabled={loading}
          required
        />
        
        <div className="create-post-footer">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isHelp}
              onChange={(e) => setIsHelp(e.target.checked)}
              disabled={loading}
            />
            Mark as Help Request
          </label>
          
          <div className="create-post-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
