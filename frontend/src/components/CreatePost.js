import React, { useState } from 'react';
import { postService } from '../services/postService';
import { compressMediaFile } from '../utils/mediaUtils';
import './CreatePost.css';

const CreatePost = ({ onPostCreated, onCancel, isHelpSection }) => {
  const [content, setContent] = useState('');
  const [isHelp, setIsHelp] = useState(isHelpSection || false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreview, setMediaPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [compressing, setCompressing] = useState(false);

  const handleMediaChange = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 4) {
      setError('You can upload maximum 4 files');
      return;
    }

    setCompressing(true);
    setError('');
    
    const previews = [];
    const base64Files = [];
    
    try {
      for (const file of files) {
        // Validate file size (max 10MB before compression)
        if (file.size > 10 * 1024 * 1024) {
          setError(`File ${file.name} is too large. Max size is 10MB`);
          setCompressing(false);
          return;
        }

        // Validate file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          setError(`File ${file.name} is not a valid image or video`);
          setCompressing(false);
          return;
        }

        // Compress the file
        const compressedBase64 = await compressMediaFile(file);
        
        base64Files.push(compressedBase64);
        previews.push({
          type: file.type.startsWith('image/') ? 'image' : 'video',
          url: compressedBase64,
          name: file.name
        });
      }
      
      setMediaFiles(base64Files);
      setMediaPreview(previews);
    } catch (err) {
      setError('Failed to process media files. Please try again.');
      console.error('Media compression error:', err);
    } finally {
      setCompressing(false);
    }
  };

  const handleRemoveMedia = (index) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    setMediaPreview(mediaPreview.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Post content cannot be empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await postService.createPost(content, isHelp, mediaFiles);
      setContent('');
      setMediaFiles([]);
      setMediaPreview([]);
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
      {compressing && <div className="info-message">Compressing media files...</div>}
      
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
        
        {mediaPreview.length > 0 && (
          <div className="media-preview-container">
            {mediaPreview.map((media, index) => (
              <div key={index} className="media-preview-item">
                {media.type === 'image' ? (
                  <img src={media.url} alt={media.name} className="media-preview-img" />
                ) : (
                  <video src={media.url} className="media-preview-video" controls />
                )}
                <button
                  type="button"
                  className="media-remove-btn"
                  onClick={() => handleRemoveMedia(index)}
                  disabled={loading}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="create-post-footer">
          <div className="create-post-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isHelp}
                onChange={(e) => setIsHelp(e.target.checked)}
                disabled={loading}
              />
              Mark as Help Request
            </label>
            
            <label className="file-upload-label">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleMediaChange}
                disabled={loading || compressing}
                style={{ display: 'none' }}
              />
              <span className="upload-btn">
                {compressing ? '⏳ Compressing...' : '📎 Add Photo/Video'}
              </span>
            </label>
          </div>
          
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
