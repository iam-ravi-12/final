import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communityService } from '../services/communityService';
import { authService } from '../services/authService';
import ReportModal from '../components/ReportModal';
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
  const [showReportCommunityModal, setShowReportCommunityModal] = useState(false);
  const [showReportPostModal, setShowReportPostModal] = useState(false);
  const [reportPostTarget, setReportPostTarget] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [editProfilePic, setEditProfilePic] = useState('');
  const [editProfilePicBase64, setEditProfilePicBase64] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadCommunityData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      const communityData = await communityService.getCommunityById(communityId);
      setCommunity(communityData);

      // Only load posts if user is a member
      if (communityData.isMember) {
        const postsData = await communityService.getCommunityPosts(communityId);
        setPosts(postsData);

        if (communityData.isAdmin) {
          const pendingData = await communityService.getPendingPosts(communityId);
          setPendingPosts(pendingData);
        }
      } else {
        // Clear posts if not a member
        setPosts([]);
        setPendingPosts([]);
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

  const handleJoinCommunity = async () => {
    try {
      await communityService.joinCommunity(communityId);
      setError('');
      alert('Joined community successfully!');
      loadCommunityData();
    } catch (err) {
      setError(err.response?.data || 'Failed to join community.');
    }
  };

  const handleOpenEditModal = () => {
    if (community) {
      setEditName(community.name);
      setEditDescription(community.description || '');
      setEditIsPrivate(community.isPrivate);
      setEditProfilePic(community.profilePicture || '');
      setEditProfilePicBase64('');
      setShowEditModal(true);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditProfilePic(reader.result);
        setEditProfilePicBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert('Community name cannot be empty');
      return;
    }

    setSubmittingEdit(true);
    try {
      const updated = await communityService.updateCommunity(
        communityId,
        editName.trim(),
        editDescription.trim(),
        editIsPrivate,
        editProfilePicBase64 || editProfilePic
      );
      setCommunity(updated);
      alert('Community updated successfully!');
      setShowEditModal(false);
      loadCommunityData();
    } catch (err) {
      alert('Failed to update community: ' + (err.response?.data || err.message));
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await communityService.deletePost(postId);
        alert('Post deleted successfully');
        loadCommunityData();
      } catch (err) {
        alert('Failed to delete post: ' + (err.response?.data || err.message));
      }
    }
  };

  const handleShareCommunity = () => {
    const shareUrl = `${window.location.origin}/community/${communityId}`;
    
    // Try to use the Web Share API if available (mobile)
    if (navigator.share) {
      navigator.share({
        title: community.name,
        text: `Join ${community.name} on our social network!`,
        url: shareUrl,
      }).catch((err) => {
        // If share is cancelled, fallback to copy
        if (err.name !== 'AbortError') {
          copyToClipboard(shareUrl);
        }
      });
    } else {
      // Fallback to copy to clipboard
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Community link copied to clipboard!');
    }).catch((err) => {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Community link copied to clipboard!');
      } catch (err) {
        alert('Failed to copy link. Please copy manually: ' + text);
      }
      document.body.removeChild(textArea);
    });
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
            <button className="btn-share" onClick={handleShareCommunity}>
              🔗 Share
            </button>
            {!community.isAdmin && community.isMember && (
              <button className="btn-leave" onClick={handleLeaveCommunity}>
                Leave Community
              </button>
            )}
            {!community.isAdmin && !community.isMember && (
              <button className="btn-join" onClick={handleJoinCommunity}>
                Join Community
              </button>
            )}
            {!community.isAdmin && (
              <button className="btn-report" onClick={() => setShowReportCommunityModal(true)} style={{ backgroundColor: 'var(--danger-color)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}>
                🚩 Report
              </button>
            )}
            {community.isAdmin && (
              <button className="btn-edit-community" onClick={handleOpenEditModal} style={{ backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}>
                ✏️ Edit Community
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {community.isAdmin && community.isMember && (
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

      {!community.isMember ? (
        <div className="not-member-container">
          <div className="not-member-content">
            <div className="not-member-icon">🔒</div>
            <h2>Join to See Posts</h2>
            <p>You must be a member of this community to view and create posts.</p>
            <button className="btn-join-community" onClick={handleJoinCommunity}>
              Join Community
            </button>
          </div>
        </div>
      ) : (
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
                        <div className="post-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                          {post.userId !== currentUser?.id && (
                            <button 
                              className="report-post-btn" 
                              onClick={() => {
                                setReportPostTarget(post.id);
                                setShowReportPostModal(true);
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600' }}
                            >
                              🚩 Report
                            </button>
                          )}
                          {(community.isAdmin || post.userId === currentUser?.id) && (
                            <button 
                              className="delete-post-btn" 
                              onClick={() => handleDeletePost(post.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600', marginLeft: '10px' }}
                            >
                              🗑️ Delete
                            </button>
                          )}
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
      )}
      <ReportModal
        isOpen={showReportCommunityModal}
        onClose={() => setShowReportCommunityModal(false)}
        targetType="community"
        targetIds={{ reportedCommunityId: parseInt(communityId) }}
      />

      <ReportModal
        isOpen={showReportPostModal}
        onClose={() => {
          setShowReportPostModal(false);
          setReportPostTarget(null);
        }}
        targetType="community post"
        targetIds={{ reportedCommunityPostId: reportPostTarget }}
      />

      {showEditModal && (
        <div className="edit-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: 'var(--shadow-lg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
            <h3>Edit Community</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: 'var(--text-secondary)' }}>Community Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: 'var(--text-secondary)' }}>Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows="3"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="editIsPrivate"
                  checked={editIsPrivate}
                  onChange={(e) => setEditIsPrivate(e.target.checked)}
                />
                <label htmlFor="editIsPrivate" style={{ fontWeight: '600', cursor: 'pointer', color: 'var(--text-secondary)' }}>Private Community (Invite-only)</label>
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: 'var(--text-secondary)' }}>Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'block', width: '100%', marginBottom: '10px', color: 'var(--text-primary)' }}
                />
                {editProfilePic ? (
                  <img src={editProfilePic} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : null}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)} disabled={submittingEdit}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submittingEdit} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--primary-color)', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                  {submittingEdit ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityDetail;
