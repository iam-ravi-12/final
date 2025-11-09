import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { followService } from '../services/followService';
import { authService } from '../services/authService';
import './Following.css';

const Following = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [following, setFollowing] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const currentUser = authService.getCurrentUser();
  const isOwnProfile = !userId || parseInt(userId) === currentUser.id;

  useEffect(() => {
    loadFollowing();
    if (isOwnProfile) {
      loadPendingRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadFollowing = async () => {
    try {
      setLoading(true);
      const targetUserId = userId || currentUser.id;
      const data = await followService.getFollowing(targetUserId);
      setFollowing(data);
    } catch (err) {
      setError('Failed to load following');
      console.error('Error loading following:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const data = await followService.getPendingRequests();
      setPendingRequests(data);
    } catch (err) {
      console.error('Error loading pending requests:', err);
    }
  };

  const handleAccept = async (followId) => {
    setActionLoading(followId);
    try {
      await followService.acceptFollowRequest(followId);
      // Reload both lists
      await loadPendingRequests();
      await loadFollowing();
    } catch (err) {
      console.error('Error accepting request:', err);
      setError('Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (followId) => {
    setActionLoading(followId);
    try {
      await followService.rejectFollowRequest(followId);
      // Reload pending requests
      await loadPendingRequests();
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError('Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserClick = (userId) => {
    if (userId === currentUser.id) {
      navigate('/profile');
    } else {
      navigate(`/user/${userId}`);
    }
  };

  const handleBackToProfile = () => {
    if (userId && parseInt(userId) !== currentUser.id) {
      navigate(`/user/${userId}`);
    } else {
      navigate('/profile');
    }
  };

  if (loading) {
    return (
      <div className="following-container">
        <div className="loading">Loading following...</div>
      </div>
    );
  }

  return (
    <div className="following-container">
      <header className="following-header">
        <button onClick={handleBackToProfile} className="btn-back">
          ← Back to Profile
        </button>
        <h1>Following</h1>
      </header>

      <div className="following-content">
        {error && <div className="error-message">{error}</div>}
        
        {isOwnProfile && pendingRequests.length > 0 && (
          <div className="pending-requests-section">
            <h2>Pending Requests ({pendingRequests.length})</h2>
            <div className="pending-requests-list">
              {pendingRequests.map(request => (
                <div key={request.id} className="request-card">
                  <div 
                    className="request-user-info"
                    onClick={() => handleUserClick(request.userId)}
                  >
                    <div className="request-avatar">
                      {request.profilePicture ? (
                        <img src={request.profilePicture} alt={request.name || request.username} />
                      ) : (
                        <div className="avatar-placeholder">
                          <span>{(request.name || request.username).charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    <div className="request-info">
                      <h3>{request.name || request.username}</h3>
                      <p className="request-username">@{request.username}</p>
                      {request.profession && (
                        <p className="request-profession">{request.profession}</p>
                      )}
                    </div>
                  </div>
                  <div className="request-actions">
                    <button 
                      onClick={() => handleAccept(request.id)}
                      className="btn-accept"
                      disabled={actionLoading === request.id}
                    >
                      ✓ Accept
                    </button>
                    <button 
                      onClick={() => handleReject(request.id)}
                      className="btn-reject"
                      disabled={actionLoading === request.id}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="following-list-section">
          {following.length === 0 ? (
            <div className="no-following">
              <p>Not following anyone yet</p>
            </div>
          ) : (
            <div className="following-list">
              {following.map(user => (
                <div 
                  key={user.id} 
                  className="following-card"
                  onClick={() => handleUserClick(user.userId)}
                >
                  <div className="following-avatar">
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt={user.name || user.username} />
                    ) : (
                      <div className="avatar-placeholder">
                        <span>{(user.name || user.username).charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="following-info">
                    <h3>{user.name || user.username}</h3>
                    <p className="following-username">@{user.username}</p>
                    {user.profession && (
                      <p className="following-profession">{user.profession}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Following;
