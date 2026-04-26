const express = require('express');
const router = express.Router();
const ProgressService = require('../services/progressService');
const auth = require('../auth/auth');

router.use(auth);

// GET /api/progress/stats — dashboard stats (today + overall)
router.get('/stats', async (req, res) => {
  try {
    const stats = await ProgressService.getDashboardStats(req.session.userId);
    res.json(stats);
  } catch (err) {
    console.error('Progress stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/progress/history?days=7 — last N days of history
router.get('/history', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const history = await ProgressService.getProgressHistory(req.session.userId, days);
    res.json(history);
  } catch (err) {
    console.error('Progress history error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
