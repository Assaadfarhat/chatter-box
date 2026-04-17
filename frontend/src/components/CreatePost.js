import React, { useState } from 'react';
import api from '../api/axios';
import { fileToBase64 } from '../utils/media';

export default function CreatePost({ onClose, onCreated }) {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!image) {
      setError('Please select an image');
      return;
    }
    setLoading(true);
    try {
      const image_url = await fileToBase64(image);
      const res = await api.post('/posts', { image_url, caption });
      if (onCreated) onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">New Post</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="file-input-wrapper">
            <label className="file-input-label">Photo *</label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              style={{ padding: '8px', cursor: 'pointer' }}
            />
            {preview && (
              <img src={preview} alt="Preview" className="file-preview" />
            )}
          </div>
          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Posting...' : 'Share Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
