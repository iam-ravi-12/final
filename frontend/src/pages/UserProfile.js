import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postService } from '../services/postService';
import { authService } from '../services/authService';
import { followService } from '../services/followService';
import PostCard from '../components/PostCard';
import './UserProfile.css';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [followStats, setFollowStats] = useState({ 
    followerCount: 0, 
    followingCount: 0,
    isFollowing: false,
    hasPendingRequest: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const currentUser = authService.getCurrentUser();

  const loadUserPosts = async () => {
    try {
      setLoading(true);
      const userPosts = await postService.getPostsByUser(userId);
      setPosts(userPosts);
      
      // Fetch user profile data
      const profile = await authService.getUserProfileById(userId);
      setUserProfile(profile);
      
      // Fetch follow stats
      const stats = await followService.getFollowStats(userId);
      setFollowStats(stats);
    } catch (err) {
      setError('Failed to load user posts');
      console.error('Error loading user posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleBackToHome = () => {
    navigate('/home');
  };

  const handleEditProfile = () => {
    navigate('/profile-edit');
  };

  const handleMessageUser = () => {
    if (userProfile) {
      navigate(`/chat/${userId}`, {
        state: {
          userId: userProfile.id,
          username: userProfile.username,
          profession: userProfile.profession
        }
      });
    }
  };

  const handleFollowAction = async () => {
    if (actionLoading) return;
    
    setActionLoading(true);
    try {
      if (followStats.isFollowing) {
        await followService.unfollow(userId);
      } else if (followStats.hasPendingRequest) {
        // Cancel pending request
        await followService.unfollow(userId);
      } else {
        await followService.sendFollowRequest(userId);
      }
      // Reload stats
      const stats = await followService.getFollowStats(userId);
      setFollowStats(stats);
    } catch (err) {
      console.error('Error with follow action:', err);
      setError(err.response?.data || 'Failed to perform action');
    } finally {
      setActionLoading(false);
    }
  };

  const getFollowButtonText = () => {
    if (followStats.isFollowing) return 'Unfollow';
    if (followStats.hasPendingRequest) return 'Request Pending';
    return 'Follow';
  };

  if (loading) {
    return (
      <div className="user-profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === parseInt(userId);

  return (
    <div className="user-profile-container">
      <header className="user-profile-header">
        <button onClick={handleBackToHome} className="btn-back">
          ← Back to Home
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {userProfile && (
        <div className="user-profile-info">
          <div className="user-profile-avatar">
            {userProfile.profilePicture ? (
              <img src={userProfile.profilePicture} alt={userProfile.name || userProfile.username} />
            ) : (
              <span>{(userProfile.name || userProfile.username).charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="user-profile-details">
            <div className="profile-header-row">
              <div>
                <h1>{userProfile.name || userProfile.username}</h1>
                <p className="user-username">@{userProfile.username}</p>
              </div>
              {isOwnProfile ? (
                <button onClick={handleEditProfile} className="btn-edit">
                  ✏️ Edit Profile
                </button>
              ) : (
                <div className="action-buttons">
                  <button 
                    onClick={handleFollowAction} 
                    className={`btn-follow ${followStats.isFollowing ? 'following' : ''}`}
                    disabled={actionLoading}
                  >
                    {getFollowButtonText()}
                  </button>
                  <button onClick={handleMessageUser} className="btn-message">
                    💬 Message
                  </button>
                </div>
              )}
            </div>
            <div className="user-stats">
              <div className="stat-item">
                <span className="stat-value">{posts.length}</span>
                <span className="stat-label">{posts.length === 1 ? 'Post' : 'Posts'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{followStats.followerCount}</span>
                <span className="stat-label">{followStats.followerCount === 1 ? 'Follower' : 'Followers'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{followStats.followingCount}</span>
                <span className="stat-label">Following</span>
              </div>
            </div>
            {userProfile.profession && (
              <p className="user-profession">{userProfile.profession}</p>
            )}
          </div>
        </div>
      )}

      <div className="user-profile-posts">
        <h2>Posts</h2>
        {posts.length === 0 ? (
          <p className="no-posts">No posts yet</p>
        ) : (
          <div className="posts-grid">
            {posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onPostUpdate={loadUserPosts}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
