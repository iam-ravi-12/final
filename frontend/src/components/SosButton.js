import React, { useState, useEffect } from 'react';
import { sosService } from '../services/sosService';
import './SosButton.css';

const SosButton = () => {
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [emergencyType, setEmergencyType] = useState('GENERAL');
  const [description, setDescription] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          setLocationError('Location access denied. SOS will be sent without location.');
          console.error('Location error:', error);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    let timer;
    if (showModal && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (showModal && countdown === 0) {
      // Auto-send SOS when countdown reaches 0
      sendSOS();
    }
    return () => clearTimeout(timer);
  }, [showModal, countdown]);

  const handleSosClick = () => {
    setShowModal(true);
    setCountdown(15);
  };

  const handleCancel = () => {
    setShowModal(false);
    setCountdown(15);
    setDescription('');
  };

  const sendSOS = async () => {
    if (isSending) return;
    
    setIsSending(true);
    try {
      const alertData = {
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        locationAddress: 'User location', // Could be enhanced with reverse geocoding
        emergencyType: emergencyType,
        description: description || 'Emergency SOS alert sent',
      };

      await sosService.createSosAlert(alertData);
      alert('SOS alert sent successfully! Nearby community members and emergency services have been notified.');
      setShowModal(false);
      setCountdown(15);
      setDescription('');
    } catch (error) {
      alert('Failed to send SOS: ' + (error.message || error));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button 
        className="sos-button"
        onClick={handleSosClick}
        title="Emergency SOS"
      >
        SOS
      </button>

      {showModal && (
        <div className="sos-modal-overlay">
          <div className="sos-modal">
            <div className="sos-modal-header">
              <h2>🚨 Emergency SOS</h2>
              <div className="countdown-circle">
                <div className="countdown-number">{countdown}</div>
              </div>
            </div>

            <div className="sos-modal-content">
              <p className="sos-message">
                {countdown > 0 
                  ? `Alert will be sent automatically in ${countdown} seconds`
                  : 'Sending alert...'}
              </p>

              {locationError && (
                <p className="location-error">{locationError}</p>
              )}

              <div className="emergency-type-selector">
                <label>Emergency Type:</label>
                <select 
                  value={emergencyType} 
                  onChange={(e) => setEmergencyType(e.target.value)}
                >
                  <option value="GENERAL">General Emergency</option>
                  <option value="ACCIDENT">Accident</option>
                  <option value="WOMEN_SAFETY">Women Safety</option>
                  <option value="MEDICAL">Medical Emergency</option>
                  <option value="FIRE">Fire</option>
                </select>
              </div>

              <div className="description-field">
                <label>Additional Details (Optional):</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the emergency..."
                  rows="3"
                />
              </div>

              <div className="sos-modal-actions">
                <button 
                  className="btn-cancel"
                  onClick={handleCancel}
                  disabled={isSending}
                >
                  Cancel
                </button>
                <button 
                  className="btn-send-now"
                  onClick={sendSOS}
                  disabled={isSending}
                >
                  {isSending ? 'Sending...' : 'Send Now'}
                </button>
              </div>

              <p className="sos-info">
                This will alert nearby community members, police, ambulance, and fire services.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SosButton;
