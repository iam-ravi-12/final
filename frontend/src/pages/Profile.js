import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    profession: '',
    organization: '',
    location: '',
    profilePicture: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await authService.getUserProfile();
        setFormData({
          username: profile.username || '',
          email: profile.email || '',
          profession: profile.profession || '',
          organization: profile.organization || '',
          location: profile.location || '',
          profilePicture: profile.profilePicture || '',
        });
        if (profile.profilePicture) {
          setPreviewImage(profile.profilePicture);
        }
      } catch (err) {
        setError('Failed to load profile. Please try again.');
        console.error('Error loading profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData({
          ...formData,
          profilePicture: base64String,
        });
        setPreviewImage(base64String);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData({
      ...formData,
      profilePicture: '',
    });
    setPreviewImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authService.updateProfile(
        formData.profession, 
        formData.organization,
        formData.location,
        formData.profilePicture
      );
      setSuccess('Profile updated successfully!');
      
      // Update local storage with new profile data
      const user = authService.getCurrentUser();
      user.profession = formData.profession;
      user.organization = formData.organization;
      localStorage.setItem('user', JSON.stringify(user));
    } catch (err) {
      setError(err.response?.data || 'Profile update failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleBackToHome = () => {
    navigate('/home');
  };

  const handleGoToMessages = () => {
    navigate('/messages');
  };

  if (loadingProfile) {
    return (
      <div className="profile-container">
        <header className="profile-header">
          <div className="header-content">
            <h1>Profile</h1>
          </div>
        </header>
        <div className="profile-content">
          <div className="loading">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="header-content">
          <h1>Profile</h1>
          <div className="user-info">
            <button onClick={handleBackToHome} className="btn-back">
              🏠 Home
            </button>
            <button onClick={handleGoToMessages} className="btn-messages">
              💬 Messages
            </button>
            <span className="username">{formData.username}</span>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="profile-content">
        <div className="profile-card">
          <h2>Edit Your Profile</h2>
          <p className="subtitle">Update your professional information</p>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group profile-picture-section">
              <label>Profile Picture</label>
              <div className="profile-picture-container">
                <div className="profile-picture-preview">
                  {previewImage ? (
                    <img src={previewImage} alt="Profile" className="profile-picture-img" />
                  ) : (
                    <div className="profile-picture-placeholder">
                      <span className="placeholder-icon">👤</span>
                    </div>
                  )}
                </div>
                <div className="profile-picture-actions">
                  <input
                    type="file"
                    id="profilePicture"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                    disabled={loading}
                  />
                  <label htmlFor="profilePicture" className="btn-upload">
                    {previewImage ? 'Change Picture' : 'Upload Picture'}
                  </label>
                  {previewImage && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="btn-remove"
                      disabled={loading}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <small className="help-text">Max file size: 5MB. Accepted formats: JPG, PNG, GIF</small>
            </div>

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                disabled
                className="input-disabled"
              />
              <small className="help-text">Username cannot be changed</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                disabled
                className="input-disabled"
              />
              <small className="help-text">Email cannot be changed</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="profession">Profession</label>
              <input
                type="text"
                id="profession"
                name="profession"
                value={formData.profession}
                onChange={handleChange}
                placeholder="e.g., Software Engineer, Doctor, Teacher"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="organization">Organization</label>
              <input
                type="text"
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                placeholder="e.g., Tech Corp, ABC Hospital"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., New York, USA"
                required
                disabled={loading}
              />
            </div>
            
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
