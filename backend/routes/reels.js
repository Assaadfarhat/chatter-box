const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.caption, r.video_url, r.created_at,
              u.id AS user_id, u.username, u.avatar
       FROM reels r
       JOIN users u ON r.user_id = u.id
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { caption, video_url } = req.body;
  if (!video_url) return res.status(400).json({ error: 'Video is required' });
  try {
    const [result] = await pool.query(
      'INSERT INTO reels (user_id, caption, video_url) VALUES (?, ?, ?)',
      [req.user.id, caption || '', video_url]
    );
    const [rows] = await pool.query(
      `SELECT r.id, r.caption, r.video_url, r.created_at,
              u.id AS user_id, u.username, u.avatar
       FROM reels r JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
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
    const [rows] = await pool.query('SELECT user_id FROM reels WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Reel not found' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await pool.query('DELETE FROM reels WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
