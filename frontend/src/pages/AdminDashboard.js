import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';
import './Admin.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [users, setUsers] = useState([]);
  const [postsCount, setPostsCount] = useState(0);
  const [communities, setCommunities] = useState([]);
  const [sosRequests, setSosRequests] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [communityMembers, setCommunityMembers] = useState([]);
  const [selectedSos, setSelectedSos] = useState(null);
  const [sosResponses, setSosResponses] = useState([]);
  
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    // Check if admin is logged in
    if (!adminService.isAdminLoggedIn()) {
      navigate('/admin-login');
      return;
    }

    fetchAllData();
  }, [navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [usersData, postsData, communitiesData, sosData] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getPostsCount(),
        adminService.getAllCommunities(),
        adminService.getAllSosRequests(),
      ]);

      setUsers(usersData);
      setPostsCount(postsData.totalPosts);
      setCommunities(communitiesData);
      setSosRequests(sosData.sosRequests);
    } catch (err) {
      setError('Error fetching admin data: ' + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    adminService.logout();
    navigate('/admin-login');
  };

  const viewCommunityMembers = async (community) => {
    try {
      setSelectedCommunity(community);
      const members = await adminService.getCommunityMembers(community.id);
      setCommunityMembers(members);
    } catch (err) {
      setError('Error fetching community members: ' + (err.response?.data || err.message));
    }
  };

  const viewSosResponses = async (sos) => {
    try {
      setSelectedSos(sos);
      const responses = await adminService.getSosResponses(sos.id);
      setSosResponses(responses);
    } catch (err) {
      setError('Error fetching SOS responses: ' + (err.response?.data || err.message));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">Loading admin data...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="admin-stats">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-number">{users.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Posts</h3>
          <p className="stat-number">{postsCount}</p>
        </div>
        <div className="stat-card">
          <h3>Total Communities</h3>
          <p className="stat-number">{communities.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total SOS Requests</h3>
          <p className="stat-number">{sosRequests.length}</p>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={activeTab === 'users' ? 'tab-active' : ''} 
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button 
          className={activeTab === 'communities' ? 'tab-active' : ''} 
          onClick={() => setActiveTab('communities')}
        >
          Communities
        </button>
        <button 
          className={activeTab === 'sos' ? 'tab-active' : ''} 
          onClick={() => setActiveTab('sos')}
        >
          SOS Requests
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'users' && (
          <div className="users-section">
            <h2>All Users ({users.length})</h2>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Profession</th>
                    <th>Organization</th>
                    <th>Location</th>
                    <th>Points</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.name || 'N/A'}</td>
                      <td>{user.email}</td>
                      <td>{user.profession || 'N/A'}</td>
                      <td>{user.organization || 'N/A'}</td>
                      <td>{user.location || 'N/A'}</td>
                      <td>{user.leaderboardPoints}</td>
                      <td>{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'communities' && (
          <div className="communities-section">
            <h2>All Communities ({communities.length})</h2>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Admin</th>
                    <th>Privacy</th>
                    <th>Members</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {communities.map(community => (
                    <tr key={community.id}>
                      <td>{community.id}</td>
                      <td>{community.name}</td>
                      <td>{community.description}</td>
                      <td>{community.adminName}</td>
                      <td>{community.isPrivate ? 'Private' : 'Public'}</td>
                      <td>{community.memberCount}</td>
                      <td>{formatDate(community.createdAt)}</td>
                      <td>
                        <button 
                          className="btn-small"
                          onClick={() => viewCommunityMembers(community)}
                        >
                          View Members
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedCommunity && (
              <div className="modal-overlay" onClick={() => setSelectedCommunity(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>Members of {selectedCommunity.name}</h3>
                    <button 
                      className="btn-close" 
                      onClick={() => setSelectedCommunity(null)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="modal-body">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>User ID</th>
                          <th>Username</th>
                          <th>Name</th>
                          <th>Profession</th>
                          <th>Joined At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {communityMembers.map(member => (
                          <tr key={member.userId}>
                            <td>{member.userId}</td>
                            <td>{member.username}</td>
                            <td>{member.name || 'N/A'}</td>
                            <td>{member.profession || 'N/A'}</td>
                            <td>{formatDate(member.joinedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sos' && (
          <div className="sos-section">
            <h2>All SOS Requests ({sosRequests.length})</h2>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Emergency Type</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Description</th>
                    <th>Responses</th>
                    <th>Created</th>
                    <th>Resolved</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sosRequests.map(sos => (
                    <tr key={sos.id}>
                      <td>{sos.id}</td>
                      <td>
                        {sos.userName} (@{sos.userUsername})
                      </td>
                      <td>{sos.emergencyType}</td>
                      <td>
                        <span className={`status-badge status-${sos.status.toLowerCase()}`}>
                          {sos.status}
                        </span>
                      </td>
                      <td>
                        {sos.latitude && sos.longitude ? (
                          <div>
                            <a 
                              href={`https://www.google.com/maps?q=${sos.latitude},${sos.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="map-link"
                              title="View on Google Maps"
                            >
                              📍 View on Map
                            </a>
                            <br />
                            <small style={{ color: '#666' }}>
                              {sos.locationAddress || `${sos.latitude}, ${sos.longitude}`}
                            </small>
                          </div>
                        ) : (
                          sos.locationAddress || 'N/A'
                        )}
                      </td>
                      <td>{sos.description || 'N/A'}</td>
                      <td>{sos.responseCount}</td>
                      <td>{formatDate(sos.createdAt)}</td>
                      <td>{formatDate(sos.resolvedAt)}</td>
                      <td>
                        <button 
                          className="btn-small"
                          onClick={() => viewSosResponses(sos)}
                        >
                          View Responses
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedSos && (
              <div className="modal-overlay" onClick={() => setSelectedSos(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>Responses to SOS #{selectedSos.id}</h3>
                    <button 
                      className="btn-close" 
                      onClick={() => setSelectedSos(null)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="modal-body">
                    {sosResponses.length === 0 ? (
                      <p>No responses yet.</p>
                    ) : (
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Responder</th>
                            <th>Response Type</th>
                            <th>Message</th>
                            <th>Points Awarded</th>
                            <th>Confirmed</th>
                            <th>Responded At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sosResponses.map(response => (
                            <tr key={response.id}>
                              <td>
                                {response.responderName} (@{response.responderUsername})
                              </td>
                              <td>{response.responseType}</td>
                              <td>{response.message || 'N/A'}</td>
                              <td>{response.pointsAwarded}</td>
                              <td>{response.confirmedByAlertOwner ? 'Yes' : 'No'}</td>
                              <td>{formatDate(response.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
