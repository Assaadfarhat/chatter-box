import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import PostCard from '../components/PostCard';
import StoryBar from '../components/StoryBar';
import CreatePost from '../components/CreatePost';
import Footer from '../components/Footer';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchFeed = async () => {
    try {
      const [postsRes, storiesRes] = await Promise.all([
        api.get('/posts'),
        api.get('/stories')
      ]);
      setPosts(postsRes.data);
      setStories(storiesRes.data);
    } catch (err) {
      setError('Failed to load feed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  // Open create modal if navigated here with ?create=1
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setShowCreate(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handlePostDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleStoryAdded = (newStory) => {
    setStories((prev) => [newStory, ...prev]);
  };

  const handleStoryDeleted = (storyId) => {
    setStories((prev) => prev.filter((s) => s.id !== storyId));
  };

  return (
    <div className="page">
      <div className="home-header">
        <span className="home-header-logo">CHATTER-BOX</span>
      </div>

      <StoryBar
        stories={stories}
        onStoryAdded={handleStoryAdded}
        onStoryDeleted={handleStoryDeleted}
      />

      {loading && <div className="loading-spinner">Loading feed...</div>}
      {error && <div style={{ padding: '16px' }}><div className="error-message">{error}</div></div>}

      {!loading && !error && posts.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📸</div>
          <div>No posts yet. Follow people or create your first post!</div>
        </div>
      )}

      <div className="feed">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onDelete={handlePostDelete} />
        ))}
      </div>

      {showCreate && (
        <CreatePost
          onClose={() => setShowCreate(false)}
          onCreated={handlePostCreated}
        />
      )}

      <Footer onCreatePost={() => setShowCreate(true)} />
    </div>
  );
}
