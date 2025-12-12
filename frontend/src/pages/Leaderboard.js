import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sosService } from '../services/sosService';
import { authService } from '../services/authService';
import './Leaderboard.css';

const Leaderboard = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await sosService.getLeaderboard(50);
      setLeaderboard(data);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (badge) => {
    switch (badge) {
      case 'GOLD':
        return '🥇';
      case 'SILVER':
        return '🥈';
      case 'BRONZE':
        return '🥉';
      default:
        return '';
    }
  };

  const getBadgeClass = (badge) => {
    switch (badge) {
      case 'GOLD':
        return 'badge-gold';
      case 'SILVER':
        return 'badge-silver';
      case 'BRONZE':
        return 'badge-bronze';
      default:
        return '';
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="leaderboard-page">
      <div className="navbar">
        <h1>🏆 Community Heroes Leaderboard</h1>
        <div className="nav-actions">
          <button onClick={() => navigate('/home')} className="btn-nav">Home</button>
          <button onClick={() => navigate('/sos-alerts')} className="btn-nav">SOS Alerts</button>
          <button onClick={() => navigate('/profile')} className="btn-nav">Profile</button>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </div>

      <div className="leaderboard-container">
        <div className="leaderboard-header">
          <h2>Top Community Helpers</h2>
          <p>Users who have helped others during emergencies earn points and badges!</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading leaderboard...</div>
        ) : (
          <>
            {leaderboard.length === 0 ? (
              <div className="no-data">
                <p>No data available yet. Be the first to help someone!</p>
              </div>
            ) : (
              <>
                {/* Top 3 Podium */}
                <div className="podium">
                  {leaderboard.slice(0, 3).map((user, index) => (
                    <div
                      key={user.userId}
                      className={`podium-place podium-${index === 0 ? 'first' : index === 1 ? 'second' : 'third'}`}
                    >
                      <div className="podium-badge">{getBadgeIcon(user.badge)}</div>
                      <div className="podium-avatar">
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt={user.username} />
                        ) : (
                          <div className="avatar-placeholder">
                            {user.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="podium-info">
                        <h3>{user.username}</h3>
                        <p className="podium-points">{user.leaderboardPoints} pts</p>
                        <p className="podium-rank">#{user.rank}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Full Leaderboard List */}
                <div className="leaderboard-list">
                  {leaderboard.map((user) => (
                    <div
                      key={user.userId}
                      className={`leaderboard-item ${getBadgeClass(user.badge)}`}
                    >
                      <div className="rank-badge">#{user.rank}</div>
                      
                      <div className="user-avatar-small">
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt={user.username} />
                        ) : (
                          <div className="avatar-placeholder-small">
                            {user.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="user-details">
                        <div className="user-name-badge">
                          <h4>{user.username}</h4>
                          {user.badge && (
                            <span className="badge-icon">{getBadgeIcon(user.badge)}</span>
                          )}
                        </div>
                        <p className="user-profession">{user.profession || 'Community Member'}</p>
                      </div>

                      <div className="points-display">
                        <span className="points-number">{user.leaderboardPoints}</span>
                        <span className="points-label">points</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <div className="points-info-section">
          <h3>How to Earn Points</h3>
          <div className="points-breakdown">
            <div className="point-item">
              <span className="point-action">On My Way</span>
              <span className="point-value">+10 pts</span>
            </div>
            <div className="point-item">
              <span className="point-action">Contacted Authorities</span>
              <span className="point-value">+15 pts</span>
            </div>
            <div className="point-item">
              <span className="point-action">Reached Location</span>
              <span className="point-value">+25 pts</span>
            </div>
            <div className="point-item">
              <span className="point-action">Situation Resolved</span>
              <span className="point-value">+50 pts</span>
            </div>
          </div>
          <p className="points-note">
            * Points are awarded when the person you helped confirms your assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
