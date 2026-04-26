const db = require('../db/db');

const ProgressService = {

  async calculateDailyProgress(userId) {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const { rows } = await db.query(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'completed' AND DATE(completed_at) = $2) AS completed_today,
          COUNT(*) FILTER (WHERE DATE(due_date) = $2) AS total_today
         FROM tasks WHERE user_id = $1`,
        [userId, todayStr]
      );

      const completedToday = parseInt(rows[0].completed_today) || 0;
      const totalToday     = parseInt(rows[0].total_today)     || 0;
      const percentage     = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

      await db.query(
        `INSERT INTO daily_progress (user_id, date, tasks_completed, tasks_total, percentage)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, date)
         DO UPDATE SET tasks_completed = $3, tasks_total = $4, percentage = $5`,
        [userId, todayStr, completedToday, totalToday, percentage]
      );

      return { completedToday, totalToday, percentage };
    } catch (err) {
      // Progress table may not exist yet — fail silently so toggle still works
      console.warn('calculateDailyProgress skipped:', err.message);
    }
  },

  async calculateStreak(userId) {
    try {
      const { rows } = await db.query(
        `SELECT date FROM daily_progress
         WHERE user_id = $1 AND percentage = 100
         ORDER BY date DESC`,
        [userId]
      );

      let streak = 0;
      const today = new Date();

      for (let i = 0; i < rows.length; i++) {
        const expected = new Date(today);
        expected.setDate(today.getDate() - i);
        const expectedStr = expected.toISOString().split('T')[0];
        const rowStr = new Date(rows[i].date).toISOString().split('T')[0];
        if (rowStr === expectedStr) {
          streak++;
        } else {
          break;
        }
      }

      await db.query(
        `UPDATE users SET streak = $1 WHERE user_id = $2`,
        [streak, userId]
      );

      return { streak };
    } catch (err) {
      // Streak column or progress table may not exist yet — fail silently
      console.warn('calculateStreak skipped:', err.message);
    }
  }
};

module.exports = ProgressService;
