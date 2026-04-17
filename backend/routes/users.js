const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.get('/search', async (req, res) => {
  const q = req.query.q || '';
  try {
    const [rows] = await pool.query(
      'SELECT id, username, full_name, avatar FROM users WHERE username LIKE ? OR full_name LIKE ? LIMIT 20',
      [`%${q}%`, `%${q}%`]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [userRows] = await pool.query(
      'SELECT id, username, email, full_name, bio, avatar, created_at FROM users WHERE id = ?',
      [id]
    );
    if (userRows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = userRows[0];

    const [[{ follower_count }]] = await pool.query(
      'SELECT COUNT(*) AS follower_count FROM follows WHERE following_id = ?',
      [id]
    );
    const [[{ following_count }]] = await pool.query(
      'SELECT COUNT(*) AS following_count FROM follows WHERE follower_id = ?',
      [id]
    );
    const [[{ post_count }]] = await pool.query(
      'SELECT COUNT(*) AS post_count FROM posts WHERE user_id = ?',
      [id]
    );

    res.json({ ...user, follower_count, following_count, post_count });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  const { full_name, bio, avatar } = req.body;
  try {
    if (avatar) {
      await pool.query(
        'UPDATE users SET full_name = ?, bio = ?, avatar = ? WHERE id = ?',
        [full_name, bio, avatar, req.user.id]
      );
    } else {
      await pool.query(
        'UPDATE users SET full_name = ?, bio = ? WHERE id = ?',
        [full_name, bio, req.user.id]
      );
    }
    const [rows] = await pool.query(
      'SELECT id, username, email, full_name, bio, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/follow', authMiddleware, async (req, res) => {
  const followingId = req.params.id;
  if (parseInt(followingId) === req.user.id) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }
  try {
    await pool.query(
      'INSERT IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)',
      [req.user.id, followingId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id/follow', authMiddleware, async (req, res) => {
  const followingId = req.params.id;
  try {
    await pool.query(
      'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
      [req.user.id, followingId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/followers', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.avatar
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = ?`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/following', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.avatar
       FROM follows f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = ?`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
