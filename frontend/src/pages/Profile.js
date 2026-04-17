import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import { mediaUrl, fileToBase64 } from '../utils/media';

function ProfileAvatar({ avatar, username }) {
  const src = mediaUrl(avatar);
  if (src) {
    return (
      <img
        src={src}
        alt={username}
        className="profile-avatar"
      />
    );
  }
  return (
    <div className="profile-avatar-placeholder">
      {username ? username[0].toUpperCase() : '?'}
    </div>
  );
}

function EditProfileModal({ currentUser, onClose, onSaved }) {
  const [fullName, setFullName] = useState(currentUser.full_name || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = { full_name: fullName, bio };
      if (avatarFile) body.avatar = await fileToBase64(avatarFile);
      const res = await api.put('/users/profile', body);
      onSaved(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal edit-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Edit Profile</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label className="form-label">Profile Photo</label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              style={{ padding: '8px', cursor: 'pointer' }}
            />
            {preview && <img src={preview} alt="Preview" className="file-preview" style={{ borderRadius: '50%', width: 80, height: 80, objectFit: 'cover' }} />}
          </div>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea
              placeholder="Tell the world about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AddAccountModal({ onClose, onAdded }) {
  const [tab, setTab] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ username: '', full_name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', loginForm);
      onAdded(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!regForm.username.trim() || !regForm.email.trim() || !regForm.password.trim()) {
      setError('Username, email, and password are required');
      return;
    }
    if (regForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', regForm);
      onAdded(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal add-account-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Add Account</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="add-account-tabs">
          <button
            className={`add-account-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
          >Log In</button>
          <button
            className={`add-account-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}
          >Sign Up</button>
        </div>
        {error && <div className="error-message" style={{ margin: '0 16px 12px' }}>{error}</div>}
        {tab === 'login' ? (
          <form className="modal-form" onSubmit={handleLogin}>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email address"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In & Switch'}
            </button>
          </form>
        ) : (
          <form className="modal-form" onSubmit={handleRegister}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Username"
                value={regForm.username}
                onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                placeholder="Full name (optional)"
                value={regForm.full_name}
                onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email address"
                value={regForm.email}
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={regForm.password}
                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create & Switch'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Profile() {
  const { id } = useParams();
  const { user, login, logout, savedAccounts, removeAccount } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedLoaded, setSavedLoaded] = useState(false);
  const [lightboxPost, setLightboxPost] = useState(null);
  const [showAddAccount, setShowAddAccount] = useState(false);

  const isOwnProfile = user && user.id === parseInt(id);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const profileRes = await api.get(`/users/${id}`);
      setProfile(profileRes.data);

      if (user && !isOwnProfile) {
        const followersRes = await api.get(`/users/${id}/followers`);
        const isFollowed = followersRes.data.some((f) => f.id === user.id);
        setIsFollowing(isFollowed);
      }

      const postsRes = await api.get(`/posts/user/${id}`);
      setPosts(postsRes.data);
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const toggleFollow = async () => {
    if (!user) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.delete(`/users/${id}/follow`);
        setIsFollowing(false);
        setProfile((p) => ({ ...p, follower_count: p.follower_count - 1 }));
      } else {
        await api.post(`/users/${id}/follow`);
        setIsFollowing(true);
        setProfile((p) => ({ ...p, follower_count: p.follower_count + 1 }));
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileSaved = (updatedUser) => {
    setProfile((p) => ({ ...p, ...updatedUser }));
    login(updatedUser, localStorage.getItem('token'));
  };

  const handleAddAccount = (newUser, newToken) => {
    login(newUser, newToken);
    setShowAddAccount(false);
    navigate('/');
  };

  const handleSwitchAccount = (account) => {
    login(account.user, account.token);
    navigate('/');
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    if (tab === 'saved' && !savedLoaded) {
      setSavedLoading(true);
      try {
        const res = await api.get('/posts/saved');
        setSavedPosts(res.data);
        setSavedLoaded(true);
      } catch {
        // leave empty
      } finally {
        setSavedLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-spinner">Loading profile...</div>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="page">
        <div style={{ padding: 16 }}><div className="error-message">{error || 'Profile not found'}</div></div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-top">
          <ProfileAvatar avatar={profile.avatar} username={profile.username} />
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-count">{profile.post_count}</span>
              <span className="profile-stat-label">Posts</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-count">{profile.follower_count}</span>
              <span className="profile-stat-label">Followers</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-count">{profile.following_count}</span>
              <span className="profile-stat-label">Following</span>
            </div>
          </div>
        </div>

        <div className="profile-info">
          <div className="profile-fullname">{profile.full_name || profile.username}</div>
          {profile.bio && <div className="profile-bio">{profile.bio}</div>}
        </div>

        <div className="profile-actions">
          {isOwnProfile ? (
            <>
              <button className="btn-secondary" onClick={() => setShowEdit(true)}>
                Edit Profile
              </button>
              <button className="btn-danger" onClick={handleLogout}>
                Log Out
              </button>
            </>
          ) : (
            <button
              className={`follow-btn ${isFollowing ? 'following' : ''}`}
              style={{ padding: '12px 24px', fontSize: '15px', borderRadius: '10px', width: '100%' }}
              onClick={toggleFollow}
              disabled={followLoading}
            >
              {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      <div className="profile-username-header">@{profile.username}</div>

      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => handleTabChange('posts')}
        >
          ⊞ POSTS
        </button>
        {isOwnProfile && (
          <button
            className={`profile-tab ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => handleTabChange('saved')}
          >
            🔖 SAVED
          </button>
        )}
        {isOwnProfile && (
          <button
            className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabChange('settings')}
          >
            ⚙ SETTINGS
          </button>
        )}
      </div>

      {activeTab === 'posts' && (
        posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📷</div>
            <div>No posts yet</div>
          </div>
        ) : (
          <div className="profile-grid">
            {posts.map((post) => (
              <div key={post.id} className="profile-grid-item" onClick={() => setLightboxPost(post)}>
                <img
                  src={mediaUrl(post.image_url)}
                  alt="Post"
                  className="profile-grid-img"
                />
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'saved' && isOwnProfile && (
        savedLoading ? (
          <div className="loading-spinner" style={{ padding: 24 }}>Loading saved posts...</div>
        ) : savedPosts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔖</div>
            <div>No saved posts yet</div>
          </div>
        ) : (
          <div className="profile-grid">
            {savedPosts.map((post) => (
              <div key={post.id} className="profile-grid-item" onClick={() => setLightboxPost(post)}>
                <img
                  src={mediaUrl(post.image_url)}
                  alt="Post"
                  className="profile-grid-img"
                />
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'settings' && isOwnProfile && (
        <div className="settings-tab">
          <div className="settings-section">
            <div className="settings-section-title">Accounts</div>
            <div className="accounts-list">
              {savedAccounts.map((account) => {
                const isActive = user && user.id === account.user.id;
                return (
                  <div key={account.user.id} className={`account-row ${isActive ? 'account-row-active' : ''}`}>
                    <div className="account-avatar-small">
                      {account.user.avatar ? (
                        <img
                          src={`http://localhost:5000/uploads/${account.user.avatar}`}
                          alt={account.user.username}
                        />
                      ) : (
                        <span>{account.user.username ? account.user.username[0].toUpperCase() : '?'}</span>
                      )}
                    </div>
                    <div className="account-info">
                      <div className="account-username">@{account.user.username}</div>
                      {account.user.full_name && (
                        <div className="account-fullname">{account.user.full_name}</div>
                      )}
                    </div>
                    <div className="account-actions">
                      {isActive ? (
                        <span className="account-active-badge">Active</span>
                      ) : (
                        <button
                          className="account-switch-btn"
                          onClick={() => handleSwitchAccount(account)}
                        >
                          Switch
                        </button>
                      )}
                      <button
                        className="account-remove-btn"
                        onClick={() => removeAccount(account.user.id)}
                        title="Remove account"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="add-account-btn" onClick={() => setShowAddAccount(true)}>
              + Add Account
            </button>
          </div>
        </div>
      )}

      {lightboxPost && (
        <div className="lightbox-overlay" onClick={() => setLightboxPost(null)}>
          <button className="lightbox-close" onClick={() => setLightboxPost(null)}>✕</button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={mediaUrl(lightboxPost.image_url)}
              alt="Post"
              className="lightbox-img"
            />
            {lightboxPost.caption && (
              <div className="lightbox-caption">{lightboxPost.caption}</div>
            )}
          </div>
        </div>
      )}

      {showEdit && (
        <EditProfileModal
          currentUser={profile}
          onClose={() => setShowEdit(false)}
          onSaved={handleProfileSaved}
        />
      )}

      {showAddAccount && (
        <AddAccountModal
          onClose={() => setShowAddAccount(false)}
          onAdded={handleAddAccount}
        />
      )}

      <Footer />
    </div>
  );
}
