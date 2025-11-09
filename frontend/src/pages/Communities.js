import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { communityService } from '../services/communityService';
import { authService } from '../services/authService';
import './Communities.css';

const Communities = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('my');
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    profilePicture: '',
  });
  const user = authService.getCurrentUser();

  useEffect(() => {
    loadCommunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadCommunities = async () => {
    setLoading(true);
    setError('');
    try {
      let data;
      if (activeTab === 'my') {
        data = await communityService.getMyCommunities();
      } else {
        data = await communityService.getAllPublicCommunities();
      }
      setCommunities(data);
    } catch (err) {
      setError('Failed to load communities. Please try again.');
      console.error('Error loading communities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/home');
  };

  const handleGoToMessages = () => {
    navigate('/messages');
  };

  const handleGoToProfile = () => {
    navigate('/profile');
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await communityService.createCommunity(
        formData.name,
        formData.description,
        formData.isPrivate,
        formData.profilePicture
      );
      setShowCreateForm(false);
      setFormData({ name: '', description: '', isPrivate: false, profilePicture: '' });
      loadCommunities();
    } catch (err) {
      setError(err.response?.data || 'Failed to create community. Please try again.');
    }
  };

  const handleJoinCommunity = async (communityId) => {
    try {
      await communityService.joinCommunity(communityId);
      loadCommunities();
    } catch (err) {
      setError(err.response?.data || 'Failed to join community.');
    }
  };

  const handleViewCommunity = (communityId) => {
    navigate(`/community/${communityId}`);
  };

  return (
    <div className="communities-wrapper">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="app-logo">Friends</h1>
          <h2>A social Network</h2>
        </div>
        
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={handleBackToHome}>
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Home</span>
          </button>
          <button className="nav-item active">
            <span className="nav-icon">👥</span>
            <span className="nav-label">Communities</span>
          </button>
          <button className="nav-item" onClick={handleGoToMessages}>
            <span className="nav-icon">💬</span>
            <span className="nav-label">Messages</span>
          </button>
          <button className="nav-item" onClick={handleGoToProfile}>
            <span className="nav-icon">👤</span>
            <span className="nav-label">Profile</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card" onClick={handleGoToProfile}>
            <div className="user-avatar-placeholder">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.username}</div>
              <div className="user-profession">{user?.profession || 'Professional'}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout-sidebar">
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="communities-container">
          <div className="communities-header">
            <h1>Communities</h1>
            <button
              className="btn-create-community"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? '✕ Cancel' : '+ Create Community'}
            </button>
          </div>

          {showCreateForm && (
            <div className="create-community-form">
              <h3>Create New Community</h3>
              <form onSubmit={handleCreateCommunity}>
                <div className="form-group">
                  <label>Community Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Enter community name"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your community"
                    rows="3"
                  />
                </div>
                <div className="form-group-checkbox">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={formData.isPrivate}
                    onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                  />
                  <label htmlFor="isPrivate">Private Community (Invite-only)</label>
                </div>
                <button type="submit" className="btn-submit">Create Community</button>
              </form>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="communities-tabs">
            <button
              className={`tab-button ${activeTab === 'my' ? 'active' : ''}`}
              onClick={() => setActiveTab('my')}
            >
              My Communities
            </button>
            <button
              className={`tab-button ${activeTab === 'public' ? 'active' : ''}`}
              onClick={() => setActiveTab('public')}
            >
              Public Communities
            </button>
          </div>

          <div className="communities-grid">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading communities...</p>
              </div>
            ) : communities.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No communities yet</h3>
                <p>{activeTab === 'my' ? 'Join or create a community to get started!' : 'No public communities available at the moment.'}</p>
              </div>
            ) : (
              communities.map((community) => (
                <div key={community.id} className="community-card">
                  <div className="community-avatar">
                    {community.profilePicture ? (
                      <img src={community.profilePicture} alt={community.name} />
                    ) : (
                      <span>{community.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="community-info">
                    <h3>{community.name}</h3>
                    <p className="community-description">{community.description}</p>
                    <div className="community-meta">
                      <span className="community-members">
                        👤 {community.memberCount} {community.memberCount === 1 ? 'member' : 'members'}
                      </span>
                      {community.isPrivate && <span className="community-badge">🔒 Private</span>}
                      {community.isAdmin && <span className="community-badge admin">👑 Admin</span>}
                    </div>
                  </div>
                  <div className="community-actions">
                    {community.isMember ? (
                      <button
                        className="btn-view"
                        onClick={() => handleViewCommunity(community.id)}
                      >
                        View
                      </button>
                    ) : (
                      !community.isPrivate && (
                        <button
                          className="btn-join"
                          onClick={() => handleJoinCommunity(community.id)}
                        >
                          Join
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Communities;
