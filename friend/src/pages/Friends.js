import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { followService } from '../services/followService';
import { authService } from '../services/authService';
import './Friends.css';

const Friends = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('following');
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ followingCount: 0, followerCount: 0 });
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [followingData, followersData, pendingData, statsData] = await Promise.all([
        followService.getFollowing(currentUser.id),
        followService.getFollowers(currentUser.id),
        followService.getPendingRequests(),
        followService.getFollowStats(currentUser.id),
      ]);

      setFollowing(followingData);
      setFollowers(followersData);
      setPendingRequests(pendingData);
      setStats({
        followingCount: statsData.followingCount || 0,
        followerCount: statsData.followerCount || 0,
      });
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (followId) => {
    setActionLoading(followId);
    try {
      await followService.acceptFollowRequest(followId);
      await loadData();
    } catch (err) {
      setError('Failed to accept request');
      console.error('Error accepting request:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (followId) => {
    setActionLoading(followId);
    try {
      await followService.rejectFollowRequest(followId);
      await loadData();
    } catch (err) {
      setError('Failed to reject request');
      console.error('Error rejecting request:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnfollow = async (userId) => {
    setActionLoading(userId);
    try {
      await followService.unfollow(userId);
      await loadData();
    } catch (err) {
      setError('Failed to unfollow');
      console.error('Error unfollowing:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const UserCard = ({ user, type }) => (
    <div className="user-card">
      <div className="user-avatar">
        {user.profilePicture ? (
          <img src={user.profilePicture} alt={user.name || user.username} />
        ) : (
          <div className="avatar-placeholder">
            {(user.name || user.username).charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="user-info">
        <h3>{user.name || user.username}</h3>
        <p className="user-username">@{user.username}</p>
        {user.profession && <p className="user-profession">{user.profession}</p>}
      </div>
      <div className="user-actions">
        {type === 'pending' && (
          <>
            <button
              className="btn-accept"
              onClick={() => handleAccept(user.id)}
              disabled={actionLoading === user.id}
            >
              {actionLoading === user.id ? '...' : '✓'}
            </button>
            <button
              className="btn-reject"
              onClick={() => handleReject(user.id)}
              disabled={actionLoading === user.id}
            >
              {actionLoading === user.id ? '...' : '✕'}
            </button>
          </>
        )}
        {type === 'following' && (
          <button
            className="btn-unfollow"
            onClick={() => handleUnfollow(user.userId)}
            disabled={actionLoading === user.userId}
          >
            {actionLoading === user.userId ? '...' : 'Unfollow'}
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="friends-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="friends-container">
      <header className="friends-header">
        <div className="header-content">
          <h1>👥 Friends</h1>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-number">{stats.followingCount}</div>
          <div className="stat-label">Following</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.followerCount}</div>
          <div className="stat-label">Followers</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{pendingRequests.length}</div>
          <div className="stat-label">Pending</div>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'following' ? 'active' : ''}`}
          onClick={() => setActiveTab('following')}
        >
          Following ({following.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'followers' ? 'active' : ''}`}
          onClick={() => setActiveTab('followers')}
        >
          Followers ({followers.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Requests ({pendingRequests.length})
        </button>
      </div>

      <div className="content-container">
        {activeTab === 'following' && (
          <div className="users-list">
            {following.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👤</div>
                <h3>No Following Yet</h3>
                <p>Start following people to see them here</p>
              </div>
            ) : (
              following.map((user) => <UserCard key={user.id} user={user} type="following" />)
            )}
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="users-list">
            {followers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No Followers Yet</h3>
                <p>When people follow you, they'll appear here</p>
              </div>
            ) : (
              followers.map((user) => <UserCard key={user.id} user={user} type="followers" />)
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="users-list">
            {pendingRequests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📬</div>
                <h3>No Pending Requests</h3>
                <p>You don't have any pending follow requests</p>
              </div>
            ) : (
              pendingRequests.map((user) => <UserCard key={user.id} user={user} type="pending" />)
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;
