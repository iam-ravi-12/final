import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communityService } from '../services/communityService';
import './CommunityDetail.css';

const CommunityDetail = () => {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [activeTab, setActiveTab] = useState('approved');

  useEffect(() => {
    loadCommunityData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      const communityData = await communityService.getCommunityById(communityId);
      setCommunity(communityData);

      const postsData = await communityService.getCommunityPosts(communityId);
      setPosts(postsData);

      if (communityData.isAdmin) {
        const pendingData = await communityService.getPendingPosts(communityId);
        setPendingPosts(pendingData);
      }
    } catch (err) {
      setError('Failed to load community. Please try again.');
      console.error('Error loading community:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      await communityService.createPost(communityId, postContent, []);
      setPostContent('');
      setShowCreatePost(false);
      setError('');
      alert('Post submitted for approval!');
      loadCommunityData();
    } catch (err) {
      setError(err.response?.data || 'Failed to create post.');
    }
  };

  const handleApprovePost = async (postId) => {
    try {
      await communityService.approvePost(postId);
      loadCommunityData();
    } catch (err) {
      setError('Failed to approve post.');
    }
  };

  const handleRejectPost = async (postId) => {
    try {
      await communityService.rejectPost(postId);
      loadCommunityData();
    } catch (err) {
      setError('Failed to reject post.');
    }
  };

  const handleLeaveCommunity = async () => {
    if (window.confirm('Are you sure you want to leave this community?')) {
      try {
        await communityService.leaveCommunity(communityId);
        navigate('/communities');
      } catch (err) {
        setError(err.response?.data || 'Failed to leave community.');
      }
    }
  };

  if (loading) {
    return (
      <div className="community-detail-container">
        <div className="loading">Loading community...</div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="community-detail-container">
        <div className="error-message">Community not found</div>
      </div>
    );
  }

  return (
    <div className="community-detail-container">
      <div className="community-header-banner">
        <button className="btn-back" onClick={() => navigate('/communities')}>
          ← Back to Communities
        </button>
        <div className="community-header-info">
          <div className="community-avatar-large">
            {community.profilePicture ? (
              <img src={community.profilePicture} alt={community.name} />
            ) : (
              <span>{community.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="community-details">
            <h1>{community.name}</h1>
            <p className="community-description">{community.description}</p>
            <div className="community-stats">
              <span>👤 {community.memberCount} members</span>
              {community.isPrivate && <span className="badge-private">🔒 Private</span>}
              {community.isAdmin && <span className="badge-admin">👑 Admin</span>}
            </div>
          </div>
          <div className="community-actions-header">
            {!community.isAdmin && (
              <button className="btn-leave" onClick={handleLeaveCommunity}>
                Leave Community
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {community.isAdmin && (
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            Approved Posts
          </button>
          <button
            className={`admin-tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Approval ({pendingPosts.length})
          </button>
        </div>
      )}

      <div className="community-content">
        <div className="create-post-section">
          {!showCreatePost ? (
            <button
              className="btn-create-post"
              onClick={() => setShowCreatePost(true)}
            >
              + Create Post in this Community
            </button>
          ) : (
            <form className="create-post-form" onSubmit={handleCreatePost}>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Write your post here..."
                rows="4"
                required
              />
              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  Submit for Approval
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowCreatePost(false);
                    setPostContent('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="posts-section">
          {activeTab === 'approved' ? (
            <>
              <h3>Community Posts</h3>
              {posts.length === 0 ? (
                <div className="empty-state">
                  <p>No posts yet. Be the first to post!</p>
                </div>
              ) : (
                <div className="posts-list">
                  {posts.map((post) => (
                    <div key={post.id} className="community-post-card">
                      <div className="post-header">
                        <div className="post-author">
                          <div className="author-avatar">
                            {post.userProfilePicture ? (
                              <img src={post.userProfilePicture} alt={post.username} />
                            ) : (
                              <span>{post.username.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="author-info">
                            <strong>{post.username}</strong>
                            <span className="post-date">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="post-content">
                        <p>{post.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h3>Pending Posts (Admin Only)</h3>
              {pendingPosts.length === 0 ? (
                <div className="empty-state">
                  <p>No pending posts</p>
                </div>
              ) : (
                <div className="posts-list">
                  {pendingPosts.map((post) => (
                    <div key={post.id} className="community-post-card pending">
                      <div className="post-header">
                        <div className="post-author">
                          <div className="author-avatar">
                            {post.userProfilePicture ? (
                              <img src={post.userProfilePicture} alt={post.username} />
                            ) : (
                              <span>{post.username.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="author-info">
                            <strong>{post.username}</strong>
                            <span className="post-date">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="admin-actions">
                          <button
                            className="btn-approve"
                            onClick={() => handleApprovePost(post.id)}
                          >
                            ✓ Approve
                          </button>
                          <button
                            className="btn-reject"
                            onClick={() => handleRejectPost(post.id)}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                      <div className="post-content">
                        <p>{post.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityDetail;
