import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import ReelCard from '../components/ReelCard';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { fileToBase64 } from '../utils/media';

export default function Reels() {
  const { user } = useAuth();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fileInputRef = useRef(null);

  const fetchReels = async () => {
    try {
      const res = await api.get('/reels');
      setReels(res.data);
    } catch {
      setError('Failed to load reels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  const openModal = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setCaption('');
    setUploadError('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (uploading) return;
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setShowModal(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setUploadError('');
  };

  const handleUpload = async () => {
    if (!videoFile) {
      setUploadError('Please select a video first.');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const video_url = await fileToBase64(videoFile);
      const res = await api.post('/reels', { video_url, caption });
      setReels((prev) => [res.data, ...prev]);
      closeModal();
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-spinner">Loading reels...</div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div style={{ padding: 16 }}><div className="error-message">{error}</div></div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <div className="reels-page">
        {reels.length === 0 && (
          <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="empty-state">
              <div className="empty-state-icon">🎬</div>
              <div>No reels yet. Be the first to post one!</div>
              <button className="btn-primary" style={{ marginTop: 16 }} onClick={openModal}>
                Upload Reel
              </button>
            </div>
          </div>
        )}
        {reels.map((reel) => (
          <ReelCard key={reel.id} reel={reel} />
        ))}
      </div>

      <button className="reels-upload-btn" onClick={openModal} title="Upload Reel">
        +
      </button>

      <Footer onCreatePost={openModal} />

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Upload Reel</span>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <div className="modal-form">
              {!videoPreview ? (
                <div
                  className="reel-upload-drop"
                  onClick={() => fileInputRef.current.click()}
                >
                  <div className="reel-upload-icon">🎬</div>
                  <div className="reel-upload-text">Tap to select a video</div>
                  <div className="reel-upload-hint">MP4, MOV, or WebM</div>
                </div>
              ) : (
                <div className="reel-upload-preview">
                  <video
                    src={videoPreview}
                    controls
                    className="reel-upload-video"
                  />
                  <button
                    className="reel-upload-change"
                    onClick={() => fileInputRef.current.click()}
                  >
                    Change video
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              <textarea
                className="form-input"
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                style={{ resize: 'none' }}
              />

              {uploadError && (
                <div className="error-message">{uploadError}</div>
              )}

              <button
                className="btn-primary"
                onClick={handleUpload}
                disabled={uploading || !videoFile}
              >
                {uploading ? 'Uploading...' : 'Post Reel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
