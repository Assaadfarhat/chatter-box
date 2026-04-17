import React, { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { mediaUrl, fileToBase64 } from '../utils/media';

function AvatarCircle({ avatar, username, size = 56 }) {
  const src = mediaUrl(avatar);
  if (src) {
    return (
      <img
        src={src}
        alt={username}
        className="story-avatar"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div className="story-avatar-placeholder" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {username ? username[0].toUpperCase() : '?'}
    </div>
  );
}

export default function StoryBar({ stories, onStoryAdded, onStoryDeleted }) {
  const { user } = useAuth();
  const [viewStory, setViewStory] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const groupedByUser = stories.reduce((acc, story) => {
    const uid = story.user_id;
    if (!acc[uid]) acc[uid] = { user_id: uid, username: story.username, avatar: story.avatar, stories: [] };
    acc[uid].stories.push(story);
    return acc;
  }, {});

  const uniqueUsers = Object.values(groupedByUser);

  const handleAddStory = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploading(true);
      try {
        const image_url = await fileToBase64(file);
        const res = await api.post('/stories', { image_url });
        if (onStoryAdded) onStoryAdded(res.data);
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to upload story');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const handleDeleteStory = async () => {
    if (!viewStory) return;
    if (!window.confirm('Delete this story?')) return;
    setDeleting(true);
    try {
      await api.delete(`/stories/${viewStory.id}`);
      if (onStoryDeleted) onStoryDeleted(viewStory.id);
      setViewStory(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete story');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="story-bar">
        <div className="story-bar-inner">
          <div className="story-item" onClick={handleAddStory}>
            <div className="story-ring story-ring-add">
              <div className="story-add-icon">+</div>
            </div>
            <span className="story-username">{uploading ? 'Uploading...' : 'Your story'}</span>
          </div>

          {uniqueUsers.map((u) => (
            <div
              key={u.user_id}
              className="story-item"
              onClick={() => setViewStory(u.stories[0])}
            >
              <div className="story-ring">
                <AvatarCircle avatar={u.avatar} username={u.username} size={56} />
              </div>
              <span className="story-username">{u.username}</span>
            </div>
          ))}
        </div>
      </div>

      {viewStory && (
        <div className="story-modal-overlay" onClick={() => setViewStory(null)}>
          <div className="story-modal-user">
            <AvatarCircle avatar={viewStory.avatar} username={viewStory.username} size={36} />
            <span>{viewStory.username}</span>
          </div>

          <button className="story-modal-close" onClick={() => setViewStory(null)}>✕</button>

          {user && user.id === viewStory.user_id && (
            <button
              className="story-modal-delete"
              onClick={(e) => { e.stopPropagation(); handleDeleteStory(); }}
              disabled={deleting}
            >
              {deleting ? '...' : '🗑 Delete'}
            </button>
          )}

          <img
            src={mediaUrl(viewStory.image_url)}
            alt="Story"
            className="story-modal-image"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
