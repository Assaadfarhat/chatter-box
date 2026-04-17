import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Footer({ onCreatePost }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleCreate = () => {
    if (onCreatePost) {
      onCreatePost();
    } else {
      navigate('/?create=1');
    }
  };

  return (
    <nav className="footer">
      <button
        className={`footer-btn ${isActive('/') ? 'active' : ''}`}
        onClick={() => navigate('/')}
      >
        <span style={{ fontSize: '22px' }}>🏠</span>
        <span>Home</span>
      </button>

      <button
        className={`footer-btn ${isActive('/search') ? 'active' : ''}`}
        onClick={() => navigate('/search')}
      >
        <span style={{ fontSize: '22px' }}>🔍</span>
        <span>Search</span>
      </button>

      <button className="footer-btn footer-create-btn" onClick={handleCreate}>
        <span className="footer-create-icon">+</span>
      </button>

      <button
        className={`footer-btn ${isActive('/reels') ? 'active' : ''}`}
        onClick={() => navigate('/reels')}
      >
        <span style={{ fontSize: '22px' }}>🎬</span>
        <span>Reels</span>
      </button>

      <button
        className={`footer-btn ${location.pathname === `/profile/${user?.id}` ? 'active' : ''}`}
        onClick={() => navigate(`/profile/${user?.id}`)}
      >
        <span style={{ fontSize: '22px' }}>👤</span>
        <span>Profile</span>
      </button>
    </nav>
  );
}
