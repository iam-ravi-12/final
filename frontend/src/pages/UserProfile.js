import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postService } from '../services/postService';
import { authService } from '../services/authService';
import PostCard from '../components/PostCard';
import './UserProfile.css';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentUser = authService.getCurrentUser();

  const loadUserPosts = async () => {
    try {
      setLoading(true);
      const userPosts = await postService.getPostsByUser(userId);
      setPosts(userPosts);
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
    if (posts.length > 0) {
      navigate(`/chat/${userId}`, {
        state: {
          userId: posts[0].userId,
          username: posts[0].username,
          profession: posts[0].userProfession
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="user-profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  const userInfo = posts.length > 0 ? posts[0] : null;
  const isOwnProfile = currentUser?.id === parseInt(userId);

  return (
    <div className="user-profile-container">
      <header className="user-profile-header">
        <button onClick={handleBackToHome} className="btn-back">
          ← Back to Home
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {userInfo && (
        <div className="user-profile-info">
          <div className="user-profile-avatar">
            {userInfo.userProfilePicture ? (
              <img src={userInfo.userProfilePicture} alt={userInfo.username} />
            ) : (
              <span>{userInfo.username.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="user-profile-details">
            <div className="profile-header-row">
              <div>
                <h1>{userInfo.username}</h1>
                <p className="user-username">@{userInfo.username}</p>
              </div>
              {isOwnProfile ? (
                <button onClick={handleEditProfile} className="btn-edit">
                  ✏️ Edit Profile
                </button>
              ) : (
                <button onClick={handleMessageUser} className="btn-message">
                  💬 Message
                </button>
              )}
            </div>
            <p className="user-profession">{userInfo.userProfession}</p>
            <p className="user-post-count">
              <strong>{posts.length}</strong> {posts.length === 1 ? 'post' : 'posts'}
            </p>
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
