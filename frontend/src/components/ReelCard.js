import React from 'react';
import { Link } from 'react-router-dom';
import { mediaUrl } from '../utils/media';

function Avatar({ avatar, username, size = 36 }) {
  const src = mediaUrl(avatar);
  if (src) {
    return (
      <img
        src={src}
        alt={username}
        className="avatar"
        style={{ width: size, height: size, border: '2px solid #FFD600' }}
      />
    );
  }
  return (
    <div
      className="avatar-placeholder"
      style={{ width: size, height: size, fontSize: size * 0.4, border: '2px solid #FFD600' }}
    >
      {username ? username[0].toUpperCase() : '?'}
    </div>
  );
}

export default function ReelCard({ reel }) {
  return (
    <div className="reel-card">
      <video
        className="reel-video"
        src={mediaUrl(reel.video_url)}
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="reel-overlay">
        <div className="reel-user">
          <Link to={`/profile/${reel.user_id}`}>
            <Avatar avatar={reel.avatar} username={reel.username} size={38} />
          </Link>
          <Link to={`/profile/${reel.user_id}`} className="reel-username">
            @{reel.username}
          </Link>
        </div>
        {reel.caption && <div className="reel-caption">{reel.caption}</div>}
      </div>
    </div>
  );
}
