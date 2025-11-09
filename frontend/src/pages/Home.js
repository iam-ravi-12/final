import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { postService } from '../services/postService';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const user = authService.getCurrentUser();

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      setError('');
      
      try {
        let data;
        switch (activeTab) {
          case 'all':
            data = await postService.getAllPosts();
            break;
          case 'professional':
            data = await postService.getProfessionPosts();
            break;
          case 'help':
            data = await postService.getHelpPosts();
            break;
          default:
            data = [];
        }
        setPosts(data);
      } catch (err) {
        setError('Failed to load posts. Please try again.');
        console.error('Error loading posts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [activeTab]);

  useEffect(() => {
    const loadProfilePicture = async () => {
      try {
        const profile = await authService.getUserProfile();
        if (profile.profilePicture) {
          setProfilePicture(profile.profilePicture);
        }
      } catch (err) {
        console.error('Error loading profile picture:', err);
      }
    };

    loadProfilePicture();
  }, []);

  const reloadPosts = async () => {
    setLoading(true);
    setError('');
    
    try {
      let data;
      switch (activeTab) {
        case 'all':
          data = await postService.getAllPosts();
          break;
        case 'professional':
          data = await postService.getProfessionPosts();
          break;
        case 'help':
          data = await postService.getHelpPosts();
          break;
        default:
          data = [];
      }
      setPosts(data);
    } catch (err) {
      setError('Failed to load posts. Please try again.');
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleGoToMessages = () => {
    navigate('/messages');
  };

  const handleGoToProfile = () => {
    navigate('/profile');
  };

  const handleGoToCommunities = () => {
    navigate('/communities');
  };

  const handlePostCreated = () => {
    setShowCreatePost(false);
    reloadPosts();
  };

  return (
    <div className="home-wrapper">
      {/* Top Navigation Bar */}
      <nav className="top-navbar">
        <div className="navbar-container">
          {/* Left: Brand Title */}
          <div className="navbar-brand">
            <h1 className="brand-title">Friends</h1>
            <span className="brand-tagline">Social Network</span>
          </div>
          
          {/* Center: Navigation Links */}
          <div className="navbar-center">
            <button
              className={`navbar-link ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <span className="link-icon">🏠</span>
              <span className="link-text">Home</span>
            </button>
            <button className="navbar-link" onClick={handleGoToMessages}>
              <span className="link-icon">💬</span>
              <span className="link-text">Messages</span>
            </button>
            <button className="navbar-link" onClick={handleGoToCommunities}>
              <span className="link-icon">👥</span>
              <span className="link-text">Communities</span>
            </button>
            <button className="navbar-link">
              <span className="link-icon">ℹ️</span>
              <span className="link-text">About</span>
            </button>
          </div>
          
          {/* Right: User Profile & Logout */}
          <div className="navbar-right">
            <div className="navbar-user" onClick={handleGoToProfile}>
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" className="navbar-avatar" />
              ) : (
                <div className="navbar-avatar-placeholder">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="navbar-username">{user?.username}</span>
            </div>
            <button onClick={handleLogout} className="navbar-logout-btn">
              <span>🚪</span> Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Tab Bar for Post Sections */}
      <div className="tab-bar">
        <div className="tab-container">
          <button
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span className="tab-icon">🌐</span>
            <span>All Posts</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'professional' ? 'active' : ''}`}
            onClick={() => setActiveTab('professional')}
          >
            <span className="tab-icon">💼</span>
            <span>Professional</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'help' ? 'active' : ''}`}
            onClick={() => setActiveTab('help')}
          >
            <span className="tab-icon">🆘</span>
            <span>Help</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="feed-container">
          {/* Create Post Card */}
          <div className="create-post-card">
            {!showCreatePost ? (
              <button
                className="btn-create-post-new"
                onClick={() => setShowCreatePost(true)}
              >
                <div className="create-post-avatar">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" />
                  ) : (
                    <span>{user?.username?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="create-post-placeholder">What's on your mind, {user?.username}?</span>
              </button>
            ) : (
              <CreatePost
                onPostCreated={handlePostCreated}
                onCancel={() => setShowCreatePost(false)}
                isHelpSection={activeTab === 'help'}
              />
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Posts Feed */}
          <div className="posts-feed">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No posts yet</h3>
                <p>Be the first to create a post and start the conversation!</p>
              </div>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
