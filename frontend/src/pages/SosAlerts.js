import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sosService } from '../services/sosService';
import { authService } from '../services/authService';
import './SosAlerts.css';

const SosAlerts = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [responseType, setResponseType] = useState('ON_WAY');
  const [responseMessage, setResponseMessage] = useState('');
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Location error:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    loadAlerts();
    // Refresh alerts every 30 seconds
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, [location]);

  const loadAlerts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await sosService.getActiveAlerts(
        location?.latitude,
        location?.longitude,
        50 // 50 km radius
      );
      setAlerts(data);
    } catch (err) {
      setError('Failed to load SOS alerts');
      console.error('Error loading alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = (alert) => {
    setSelectedAlert(alert);
    setResponseType('ON_WAY');
    setResponseMessage('');
  };

  const submitResponse = async () => {
    if (!selectedAlert || isResponding) return;

    setIsResponding(true);
    try {
      await sosService.respondToAlert({
        sosAlertId: selectedAlert.id,
        responseType: responseType,
        message: responseMessage || `I'm ${getResponseLabel(responseType).toLowerCase()}`,
      });

      alert('Response submitted successfully! You earned leaderboard points for helping.');
      setSelectedAlert(null);
      setResponseMessage('');
      loadAlerts();
    } catch (error) {
      alert('Failed to submit response: ' + (error.message || error));
    } finally {
      setIsResponding(false);
    }
  };

  const getResponseLabel = (type) => {
    switch (type) {
      case 'ON_WAY': return 'On My Way';
      case 'CONTACTED_AUTHORITIES': return 'Contacted Authorities';
      case 'REACHED': return 'Reached Location';
      case 'RESOLVED': return 'Resolved';
      default: return type;
    }
  };

  const getEmergencyTypeLabel = (type) => {
    switch (type) {
      case 'GENERAL': return '🚨 General Emergency';
      case 'ACCIDENT': return '🚑 Accident';
      case 'WOMEN_SAFETY': return '👩 Women Safety';
      case 'MEDICAL': return '⚕️ Medical Emergency';
      case 'FIRE': return '🔥 Fire';
      default: return type;
    }
  };

  const formatDistance = (distance) => {
    if (!distance) return 'Unknown distance';
    return distance < 1 
      ? `${(distance * 1000).toFixed(0)} meters away`
      : `${distance.toFixed(1)} km away`;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    return date.toLocaleDateString();
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="sos-alerts-page">
      <div className="navbar">
        <h1>🚨 Active SOS Alerts</h1>
        <div className="nav-actions">
          <button onClick={() => navigate('/home')} className="btn-nav">Home</button>
          <button onClick={() => navigate('/profile')} className="btn-nav">Profile</button>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </div>

      <div className="content-container">
        {error && <div className="error-message">{error}</div>}

        {loading && <div className="loading">Loading alerts...</div>}

        {!loading && alerts.length === 0 && (
          <div className="no-alerts">
            <h3>✅ No Active SOS Alerts</h3>
            <p>Great! There are no active emergencies in your area.</p>
          </div>
        )}

        <div className="alerts-grid">
          {alerts.map((alert) => (
            <div key={alert.id} className="alert-card">
              <div className="alert-header">
                <span className="emergency-badge">
                  {getEmergencyTypeLabel(alert.emergencyType)}
                </span>
                <span className="time-badge">{formatTime(alert.createdAt)}</span>
              </div>

              <div className="alert-user">
                <div className="user-avatar">
                  {alert.userProfilePicture ? (
                    <img src={alert.userProfilePicture} alt={alert.username} />
                  ) : (
                    <div className="avatar-placeholder">{alert.username?.[0]?.toUpperCase()}</div>
                  )}
                </div>
                <div className="user-info">
                  <h3>{alert.username}</h3>
                  <p>{alert.userProfession || 'Community Member'}</p>
                </div>
              </div>

              {alert.description && (
                <div className="alert-description">
                  <p>{alert.description}</p>
                </div>
              )}

              {alert.distance !== null && (
                <div className="alert-distance">
                  📍 {formatDistance(alert.distance)}
                </div>
              )}

              <div className="alert-stats">
                <span>👥 {alert.responseCount} responder{alert.responseCount !== 1 ? 's' : ''}</span>
              </div>

              <button 
                className="btn-respond"
                onClick={() => handleRespond(alert)}
              >
                Respond to Alert
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedAlert && (
        <div className="response-modal-overlay">
          <div className="response-modal">
            <h2>Respond to SOS Alert</h2>
            <p className="modal-username">Helping: {selectedAlert.username}</p>

            <div className="response-type-selector">
              <label>Response Type:</label>
              <select 
                value={responseType}
                onChange={(e) => setResponseType(e.target.value)}
              >
                <option value="ON_WAY">I'm On My Way</option>
                <option value="CONTACTED_AUTHORITIES">I Contacted Authorities</option>
                <option value="REACHED">I've Reached the Location</option>
                <option value="RESOLVED">Situation Resolved</option>
              </select>
            </div>

            <div className="response-message-field">
              <label>Message (Optional):</label>
              <textarea
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Add any additional information..."
                rows="3"
              />
            </div>

            <div className="points-info">
              💎 You'll earn leaderboard points for helping!
            </div>

            <div className="modal-actions">
              <button 
                className="btn-modal-cancel"
                onClick={() => setSelectedAlert(null)}
                disabled={isResponding}
              >
                Cancel
              </button>
              <button 
                className="btn-modal-submit"
                onClick={submitResponse}
                disabled={isResponding}
              >
                {isResponding ? 'Submitting...' : 'Submit Response'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SosAlerts;
