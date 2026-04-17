const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.caption, p.image_url, p.created_at,
              u.id AS user_id, u.username, u.avatar,
              (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS like_count,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
              (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) AS liked_by_me,
              (SELECT COUNT(*) FROM post_saves ps WHERE ps.post_id = p.id AND ps.user_id = ?) AS saved_by_me
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = ? OR p.user_id IN (
         SELECT following_id FROM follows WHERE follower_id = ?
       )
       ORDER BY p.created_at DESC`,
      [userId, userId, userId, userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.caption, p.image_url, p.created_at,
              u.id AS user_id, u.username, u.avatar
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/saved', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.caption, p.image_url, p.created_at,
              u.id AS user_id, u.username, u.avatar
       FROM post_saves ps
       JOIN posts p ON ps.post_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE ps.user_id = ?
       ORDER BY ps.created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { caption, image_url } = req.body;
  if (!image_url) return res.status(400).json({ error: 'Image is required' });
  try {
    const [result] = await pool.query(
      'INSERT INTO posts (user_id, caption, image_url) VALUES (?, ?, ?)',
      [req.user.id, caption || '', image_url]
    );
    const [rows] = await pool.query(
      `SELECT p.id, p.caption, p.image_url, p.created_at,
              u.id AS user_id, u.username, u.avatar
       FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await pool.query('DELETE FROM posts WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/like', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      'INSERT IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)',
      [id, req.user.id]
    );
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) AS count FROM post_likes WHERE post_id = ?',
      [id]
    );
    res.json({ success: true, like_count: count });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id/like', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?',
      [id, req.user.id]
    );
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) AS count FROM post_likes WHERE post_id = ?',
      [id]
    );
    res.json({ success: true, like_count: count });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/save', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      'INSERT IGNORE INTO post_saves (post_id, user_id) VALUES (?, ?)',
      [id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id/save', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      'DELETE FROM post_saves WHERE post_id = ? AND user_id = ?',
      [id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/comments', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.content, c.created_at,
              u.id AS user_id, u.username, u.avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/comments', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });
  try {
    const [result] = await pool.query(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [id, req.user.id, content.trim()]
    );
    const [rows] = await pool.query(
      `SELECT c.id, c.content, c.created_at,
              u.id AS user_id, u.username, u.avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:postId/comments/:commentId', authMiddleware, async (req, res) => {
  const { postId, commentId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT user_id FROM comments WHERE id = ? AND post_id = ?',
      [commentId, postId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Comment not found' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await pool.query('DELETE FROM comments WHERE id = ?', [commentId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
