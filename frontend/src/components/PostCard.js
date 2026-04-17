import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { mediaUrl } from '../utils/media';

function Avatar({ avatar, username, size = 34 }) {
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
    <div className="avatar-placeholder" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {username ? username[0].toUpperCase() : '?'}
    </div>
  );
}

export default function PostCard({ post, onDelete }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(!!post.liked_by_me);
  const [likeCount, setLikeCount] = useState(Number(post.like_count) || 0);
  const [saved, setSaved] = useState(!!post.saved_by_me);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(Number(post.comment_count) || 0);
  const [commentText, setCommentText] = useState('');
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [loadingComment, setLoadingComment] = useState(false);
  const lastTap = useRef(0);

  const toggleLike = async () => {
    const prev = liked;
    setLiked(!prev);
    setLikeCount((c) => c + (prev ? -1 : 1));
    try {
      if (prev) {
        await api.delete(`/posts/${post.id}/like`);
      } else {
        await api.post(`/posts/${post.id}/like`);
      }
    } catch {
      setLiked(prev);
      setLikeCount((c) => c + (prev ? 1 : -1));
    }
  };

  const toggleSave = async () => {
    const prev = saved;
    setSaved(!prev);
    try {
      if (prev) {
        await api.delete(`/posts/${post.id}/save`);
      } else {
        await api.post(`/posts/${post.id}/save`);
      }
    } catch {
      setSaved(prev);
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 350 && !liked) {
      toggleLike();
    }
    lastTap.current = now;
  };

  const loadComments = async () => {
    if (commentsLoaded) return;
    try {
      const res = await api.get(`/posts/${post.id}/comments`);
      setComments(res.data);
      setCommentsLoaded(true);
    } catch {
      alert('Failed to load comments');
    }
  };

  const toggleComments = async () => {
    if (!showComments) {
      await loadComments();
    }
    setShowComments((v) => !v);
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setLoadingComment(true);
    try {
      const res = await api.post(`/posts/${post.id}/comments`, { content: commentText.trim() });
      setComments((prev) => [...prev, res.data]);
      setCommentCount((c) => c + 1);
      setCommentText('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to post comment');
    } finally {
      setLoadingComment(false);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await api.delete(`/posts/${post.id}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentCount((c) => c - 1);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete comment');
    }
  };

  const deletePost = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${post.id}`);
      if (onDelete) onDelete(post.id);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete post');
    }
  };

  return (
    <div className="post-card">
      <div className="post-card-header">
        <Link to={`/profile/${post.user_id}`}>
          <Avatar avatar={post.avatar} username={post.username} size={36} />
        </Link>
        <Link to={`/profile/${post.user_id}`} className="post-card-username">
          {post.username}
        </Link>
        {user && user.id === post.user_id && (
          <button
            onClick={deletePost}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#666', fontSize: '18px', cursor: 'pointer' }}
            title="Delete post"
          >
            🗑
          </button>
        )}
      </div>

      <img
        src={mediaUrl(post.image_url)}
        alt="Post"
        className="post-card-image"
        onClick={handleDoubleTap}
        onTouchEnd={handleDoubleTap}
        draggable={false}
      />

      <div className="post-card-actions">
        <button className={`action-btn ${liked ? 'liked' : ''}`} onClick={toggleLike}>
          {liked ? '❤️' : '🤍'}
        </button>
        <button className="action-btn" onClick={toggleComments}>
          💬
        </button>
        <button
          className={`action-btn save-btn-right ${saved ? 'saved' : ''}`}
          onClick={toggleSave}
          style={{ opacity: saved ? 1 : 0.35, filter: saved ? 'none' : 'grayscale(1)' }}
        >
          🔖
        </button>
      </div>

      <div className="post-card-likes">{likeCount} {likeCount === 1 ? 'like' : 'likes'}</div>

      {post.caption && (
        <div className="post-card-caption">
          <strong>{post.username}</strong>{post.caption}
        </div>
      )}

      <button className="post-card-comment-toggle" onClick={toggleComments}>
        {showComments ? 'Hide comments' : `View ${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`}
      </button>

      {showComments && (
        <div className="comments-section">
          {comments.map((c) => (
            <div key={c.id} className="comment-item">
              <Link to={`/profile/${c.user_id}`}>
                <Avatar avatar={c.avatar} username={c.username} size={26} />
              </Link>
              <div className="comment-content">
                <strong>{c.username}</strong>{c.content}
              </div>
              {user && user.id === c.user_id && (
                <button
                  onClick={() => deleteComment(c.id)}
                  style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '14px', padding: '0 4px' }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <form className="comment-input-row" onSubmit={submitComment}>
            <input
              className="comment-input"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={loadingComment}
            />
            <button className="comment-submit-btn" type="submit" disabled={loadingComment || !commentText.trim()}>
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
