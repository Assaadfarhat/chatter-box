import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import { mediaUrl } from '../utils/media';

function Avatar({ avatar, username, size = 42 }) {
  const src = mediaUrl(avatar);
  if (src) {
    return (
      <img
        src={src}
        alt={username}
        className="avatar"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div className="avatar-placeholder" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {username ? username[0].toUpperCase() : '?'}
    </div>
  );
}

export default function Search() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [following, setFollowing] = useState({});
  const debounceRef = useRef(null);

  const fetchResults = async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      setResults(res.data);
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchResults(val);
    }, 400);
  };

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const toggleFollow = async (targetUser) => {
    const isFollowing = following[targetUser.id];
    setFollowing((prev) => ({ ...prev, [targetUser.id]: !isFollowing }));
    try {
      if (isFollowing) {
        await api.delete(`/users/${targetUser.id}/follow`);
      } else {
        await api.post(`/users/${targetUser.id}/follow`);
      }
    } catch (err) {
      setFollowing((prev) => ({ ...prev, [targetUser.id]: isFollowing }));
      alert(err.response?.data?.error || 'Action failed');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <span className="page-header-title">Search</span>
      </div>
      <div className="search-page">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search users..."
            value={query}
            onChange={handleInputChange}
            autoFocus
          />
        </div>

        {loading && <div className="loading-spinner">Searching...</div>}
        {error && <div className="error-message">{error}</div>}

        {!loading && query.trim() && results.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div>No users found for "{query}"</div>
          </div>
        )}

        {results.map((u) => (
          <div key={u.id} className="user-card">
            <Link to={`/profile/${u.id}`}>
              <Avatar avatar={u.avatar} username={u.username} size={46} />
            </Link>
            <div className="user-card-info">
              <Link to={`/profile/${u.id}`} className="user-card-username">{u.username}</Link>
              {u.full_name && <div className="user-card-fullname">{u.full_name}</div>}
            </div>
            {user && u.id !== user.id && (
              <button
                className={`follow-btn ${following[u.id] ? 'following' : ''}`}
                onClick={() => toggleFollow(u)}
              >
                {following[u.id] ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}
