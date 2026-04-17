const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.image_url, s.created_at, s.expires_at,
              u.id AS user_id, u.username, u.avatar
       FROM stories s
       JOIN users u ON s.user_id = u.id
       WHERE s.expires_at > NOW()
         AND (s.user_id = ? OR s.user_id IN (
           SELECT following_id FROM follows WHERE follower_id = ?
         ))
       ORDER BY s.created_at DESC`,
      [userId, userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { image_url } = req.body;
  if (!image_url) return res.status(400).json({ error: 'Image is required' });
  try {
    const [result] = await pool.query(
      'INSERT INTO stories (user_id, image_url, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))',
      [req.user.id, image_url]
    );
    const [rows] = await pool.query(
      `SELECT s.id, s.image_url, s.created_at, s.expires_at,
              u.id AS user_id, u.username, u.avatar
       FROM stories s JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
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
    const [rows] = await pool.query('SELECT user_id FROM stories WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Story not found' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await pool.query('DELETE FROM stories WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
