import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { postService } from '../services/postService';
import { followService } from '../services/followService';
import PostCard from '../components/PostCard';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followStats, setFollowStats] = useState({ followerCount: 0, followingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentUser = authService.getCurrentUser();

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await authService.getUserProfile();
      setProfile(profileData);
      
      // Load user's posts
      const userPosts = await postService.getPostsByUser(currentUser.id);
      setPosts(userPosts);
      
      // Load follow stats
      const stats = await followService.getFollowStats(currentUser.id);
      setFollowStats(stats);
    } catch (err) {
      setError('Failed to load profile. Please try again.');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBackToHome = () => {
    navigate('/home');
  };

  const handleGoToMessages = () => {
    navigate('/messages');
  };

  const handleEditProfile = () => {
    navigate('/profile-edit');
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (loading) {
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

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="error-message">Profile not found</div>
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
            <span className="username">{profile.username}</span>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="profile-content">
        {error && <div className="error-message">{error}</div>}
        
        <div className="profile-view-card">
          <div className="profile-info-section">
            <div className="profile-avatar-large">
              {profile.profilePicture ? (
                <img src={profile.profilePicture} alt={profile.name || profile.username} />
              ) : (
                <div className="avatar-placeholder">
                  <span>{(profile.name || profile.username).charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="profile-details-section">
              <div className="profile-header-row">
                <div>
                  <h2 className="profile-name">{profile.name || profile.username}</h2>
                  <p className="profile-username">@{profile.username}</p>
                </div>
                <button onClick={handleEditProfile} className="btn-edit-profile">
                  ✏️ Edit Profile
                </button>
              </div>
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-value">{posts.length}</span>
                  <span className="stat-label">{posts.length === 1 ? 'Post' : 'Posts'}</span>
                </div>
                <div className="stat-item stat-divider">
                  <span className="stat-value">{followStats.followerCount}</span>
                  <span className="stat-label">{followStats.followerCount === 1 ? 'Follower' : 'Followers'}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{followStats.followingCount}</span>
                  <span className="stat-label">Following</span>
                </div>
              </div>
              {profile.profession && (
                <p className="profile-profession">
                  <strong>Profession:</strong> {profile.profession}
                </p>
              )}
              {profile.organization && (
                <p className="profile-organization">
                  <strong>Organization:</strong> {profile.organization}
                </p>
              )}
              {profile.location && (
                <p className="profile-location">
                  <strong>Location:</strong> {profile.location}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="profile-posts-section">
          <h3>My Posts</h3>
          {posts.length === 0 ? (
            <p className="no-posts">You haven't created any posts yet</p>
          ) : (
            <div className="posts-grid">
              {posts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onPostUpdate={loadProfile}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
