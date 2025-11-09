import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { followService } from '../services/followService';
import { authService } from '../services/authService';
import './Followers.css';

const Followers = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadFollowers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadFollowers = async () => {
    try {
      setLoading(true);
      const targetUserId = userId || currentUser.id;
      const data = await followService.getFollowers(targetUserId);
      setFollowers(data);
    } catch (err) {
      setError('Failed to load followers');
      console.error('Error loading followers:', err);
    } finally {
      setLoading(false);
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
      <div className="followers-container">
        <div className="loading">Loading followers...</div>
      </div>
    );
  }

  return (
    <div className="followers-container">
      <header className="followers-header">
        <button onClick={handleBackToProfile} className="btn-back">
          ← Back to Profile
        </button>
        <h1>Followers</h1>
      </header>

      <div className="followers-content">
        {error && <div className="error-message">{error}</div>}
        
        {followers.length === 0 ? (
          <div className="no-followers">
            <p>No followers yet</p>
          </div>
        ) : (
          <div className="followers-list">
            {followers.map(follower => (
              <div 
                key={follower.id} 
                className="follower-card"
                onClick={() => handleUserClick(follower.userId)}
              >
                <div className="follower-avatar">
                  {follower.profilePicture ? (
                    <img src={follower.profilePicture} alt={follower.name || follower.username} />
                  ) : (
                    <div className="avatar-placeholder">
                      <span>{(follower.name || follower.username).charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div className="follower-info">
                  <h3>{follower.name || follower.username}</h3>
                  <p className="follower-username">@{follower.username}</p>
                  {follower.profession && (
                    <p className="follower-profession">{follower.profession}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Followers;
