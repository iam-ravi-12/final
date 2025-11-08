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

  const handlePostCreated = () => {
    setShowCreatePost(false);
    reloadPosts();
  };

  return (
    <div className="home-wrapper">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="app-logo">Professional Network</h1>
        </div>
        
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Home</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'professional' ? 'active' : ''}`}
            onClick={() => setActiveTab('professional')}
          >
            <span className="nav-icon">💼</span>
            <span className="nav-label">Professional</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'help' ? 'active' : ''}`}
            onClick={() => setActiveTab('help')}
          >
            <span className="nav-icon">🆘</span>
            <span className="nav-label">Help</span>
          </button>
          <button className="nav-item" onClick={handleGoToMessages}>
            <span className="nav-icon">💬</span>
            <span className="nav-label">Messages</span>
          </button>
          <button className="nav-item" onClick={handleGoToProfile}>
            <span className="nav-icon">👤</span>
            <span className="nav-label">Profile</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card" onClick={handleGoToProfile}>
            {profilePicture ? (
              <img src={profilePicture} alt="Profile" className="user-avatar" />
            ) : (
              <div className="user-avatar-placeholder">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="user-details">
              <div className="user-name">{user?.username}</div>
              <div className="user-profession">{user?.profession || 'Professional'}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout-sidebar">
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

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
