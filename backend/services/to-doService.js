const db = require('../db/db');

const ToDoService = {

  // Create a new task
  async createTask(taskData, userId) {
    const { title, due_date, priority } = taskData;
    const query = `
      INSERT INTO tasks (user_id, title, due_date, priority)
      VALUES ($1, $2, $3, $4) RETURNING *`;
    const result = await db.query(query, [userId, title, due_date, priority]);
    return result.rows[0];
  },

  // Update an existing task (title, due_date, priority)
  async updateTask(taskId, taskData, userId) {
    const { title, due_date, priority } = taskData;
    const query = `
      UPDATE tasks
      SET title = $1, due_date = $2, priority = $3
      WHERE id = $4 AND user_id = $5
      RETURNING *`;
    const result = await db.query(query, [title, due_date, priority, taskId, userId]);
    return result.rows[0] || null;
  },

  // Get and categorise tasks
async getCategorizedTasks(userId) {
  const query = 'SELECT * FROM tasks WHERE user_id = $1 ORDER BY due_date ASC';
  const { rows } = await db.query(query, [userId]);

  // Use LOCAL date (not UTC) to avoid timezone shifting
  const toLocalISO = (d) => {
    const date = new Date(d);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayISO    = toLocalISO(new Date());
  const nextWeekISO = toLocalISO(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const completed = rows
    .filter(t => t.status === 'completed')
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
    .slice(0, 10);

  return {
    today:    rows.filter(t => toLocalISO(t.due_date) === todayISO && t.status !== 'completed'),
    thisWeek: rows.filter(t => {
      const d = toLocalISO(t.due_date);
      return d > todayISO && d <= nextWeekISO && t.status !== 'completed';
    }),
    upcoming: rows.filter(t => toLocalISO(t.due_date) > nextWeekISO && t.status !== 'completed'),
    completed,
  };
},

  // Toggle task complete <-> pending
  async toggleTaskStatus(taskId, userId) {
    console.log('toggleTaskStatus userId:', userId);
    console.log('toggleTaskStatus taskId:', taskId);
    const query = `
      UPDATE tasks
      SET status = CASE WHEN status = 'pending' THEN 'completed' ELSE 'pending' END,
          completed_at = CASE WHEN status = 'pending' THEN NOW() ELSE NULL END
      WHERE id = $1 AND user_id = $2 RETURNING *`;
    const result = await db.query(query, [taskId, userId]);

    const ProgressService = require('./progressService');
    await ProgressService.calculateDailyProgress(userId);
    await ProgressService.calculateStreak(userId);

    return result.rows[0];
  },

  // Delete a task
  async deleteTask(taskId, userId) {
    await db.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
    return { message: 'Task deleted successfully' };
  }
};

module.exports = ToDoService;
