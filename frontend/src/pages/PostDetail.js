import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { postService } from '../services/postService';
import { formatDate } from '../utils/dateUtils';
import ReportModal from '../components/ReportModal';
import './PostDetail.css';

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [postData, commentsData] = await Promise.all([
          postService.getPostById(postId),
          postService.getComments(postId)
        ]);
        setPost(postData);
        setIsLiked(postData.likedByCurrentUser);
        setLikeCount(postData.likeCount);
        setComments(commentsData);
      } catch (err) {
        setError('Failed to load post. Please try again.');
        console.error('Error loading post:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [postId]);

  const loadPostAndComments = async () => {
    setLoading(true);
    setError('');
    try {
      const [postData, commentsData] = await Promise.all([
        postService.getPostById(postId),
        postService.getComments(postId)
      ]);
      setPost(postData);
      setIsLiked(postData.likedByCurrentUser);
      setLikeCount(postData.likeCount);
      setComments(commentsData);
    } catch (err) {
      setError('Failed to load post. Please try again.');
      console.error('Error loading post:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      await postService.toggleLike(postId);
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      await postService.addComment(postId, newComment);
      setNewComment('');
      await loadPostAndComments();
    } catch (err) {
      setError('Failed to post comment. Please try again.');
      console.error('Error posting comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/home');
  };

  const handleProfileClick = (userId, username, profession) => {
    if (!userId || userId === currentUser?.id) return;
    
    navigate('/messages', {
      state: {
        userId,
        username,
        profession
      }
    });
  };

  if (loading) {
    return (
      <div className="post-detail-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="post-detail-container">
        <div className="error-message">{error}</div>
        <button onClick={handleBack} className="btn-back">Back to Home</button>
      </div>
    );
  }

  return (
    <div className="post-detail-container">
      <header className="detail-header">
        <button onClick={handleBack} className="btn-back">← Back</button>
        <h2>Post Details</h2>
      </header>

      <div className="post-detail-content">
        <div className="post-main">
          <div className="post-header">
            <div className="post-user-info">
              <div 
                className="post-avatar"
                onClick={() => {
                  if (post.userId) {
                    handleProfileClick(post.userId, post.username, post.userProfession);
                  }
                }}
                style={{ cursor: post.userId && post.userId !== currentUser?.id ? 'pointer' : 'default' }}
              >
                {post.username.charAt(0).toUpperCase()}
              </div>
              <div className="post-details">
                <h4 className="post-username">
                  {post.username}
                  {post.isAnonymous && (
                    <span className="anon-label" style={{ fontSize: '0.8rem', fontStyle: 'italic', marginLeft: '6px', color: '#6B7280' }}>
                      {post.userId === currentUser?.id ? '(You - Anon)' : '(Anon)'}
                    </span>
                  )}
                </h4>
                <p className="post-profession">{post.userProfession}</p>
              </div>
            </div>
            <div className="post-right-section" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="post-time">
                {formatDate(post.createdAt)}
              </div>
              {post.userId && currentUser?.id !== post.userId && (
                <div className="post-menu-container" style={{ position: 'relative' }}>
                  <button className="post-menu-btn" onClick={() => setShowMenu(!showMenu)}>
                    ⋮
                  </button>
                  {showMenu && (
                    <div className="post-menu-dropdown" style={{ right: 0 }}>
                      <button 
                        className="post-menu-item" 
                        onClick={() => {
                          setShowMenu(false);
                          setShowReportModal(true);
                        }}
                      >
                        🚩 Report Post
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="post-content">
            <p>{post.content}</p>
          </div>

          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="post-media">
              {post.mediaUrls.map((url, index) => {
                const isVideo = url.startsWith('data:video');
                return (
                  <div key={index} className="post-media-item">
                    {isVideo ? (
                      <video src={url} controls className="post-media-video" />
                    ) : (
                      <img src={url} alt={`Post media ${index + 1}`} className="post-media-img" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {post.isAnonymous && (
            <div className="post-badge" style={{ display: 'inline-block', marginRight: '6px' }}>
              <span className="help-badge" style={{ backgroundColor: '#6B7280', color: '#fff' }}>🔒 Anonymous</span>
            </div>
          )}

          {post.isHelpSection && (
            <div className="post-badge" style={{ display: 'inline-block' }}>
              <span className="help-badge">Help Request</span>
            </div>
          )}

          <div className="post-actions">
            <button 
              className={`action-btn ${isLiked ? 'liked' : ''}`}
              onClick={handleLike}
            >
              <span className="action-icon">{isLiked ? '❤️' : '🤍'}</span>
              <span className="action-count">{likeCount}</span>
            </button>
            <div className="action-btn">
              <span className="action-icon">💬</span>
              <span className="action-count">{comments.length}</span>
            </div>
          </div>
        </div>

        <div className="comments-section">
          <h3>Comments</h3>
          
          <form onSubmit={handleSubmitComment} className="comment-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows="3"
              disabled={submitting}
            />
            <button 
              type="submit" 
              className="btn-submit-comment"
              disabled={!newComment.trim() || submitting}
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>

          {error && <div className="error-message">{error}</div>}

          <div className="comments-list">
            {comments.length === 0 ? (
              <div className="no-comments">
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="comment-card">
                  <div className="comment-header">
                    <div className="comment-user-info">
                      <div 
                        className="comment-avatar"
                        onClick={() => handleProfileClick(comment.userId, comment.username, comment.userProfession)}
                        style={{ cursor: comment.userId !== currentUser?.id ? 'pointer' : 'default' }}
                      >
                        {comment.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="comment-details">
                        <h5 className="comment-username">{comment.username}</h5>
                        <p className="comment-profession">{comment.userProfession}</p>
                      </div>
                    </div>
                    <div className="comment-time">
                      {formatDate(comment.createdAt)}
                    </div>
                  </div>
                  <div className="comment-content">
                    <p>{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="post"
        targetIds={{ reportedPostId: post.id }}
      />
    </div>
  );
};

export default PostDetail;
