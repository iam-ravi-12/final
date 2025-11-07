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

  const handlePostCreated = () => {
    setShowCreatePost(false);
    reloadPosts();
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <h1>Professional Network</h1>
          <div className="user-info">
            <button onClick={handleGoToMessages} className="btn-messages">
              💬 Messages
            </button>
            <span className="username">{user?.username}</span>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="home-content">
        <div className="tabs-container">
          <button
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Posts
          </button>
          <button
            className={`tab ${activeTab === 'professional' ? 'active' : ''}`}
            onClick={() => setActiveTab('professional')}
          >
            Professional
          </button>
          <button
            className={`tab ${activeTab === 'help' ? 'active' : ''}`}
            onClick={() => setActiveTab('help')}
          >
            Help Section
          </button>
        </div>

        <div className="create-post-section">
          {!showCreatePost ? (
            <button
              className="btn-create-post"
              onClick={() => setShowCreatePost(true)}
            >
              + Create Post
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

        <div className="posts-container">
          {loading ? (
            <div className="loading">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="no-posts">
              <p>No posts yet. Be the first to create one!</p>
            </div>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
