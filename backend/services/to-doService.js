// sorting logic

const db = require('../db/db');

const ToDoService = {
  // Create a new task
  async createTask(taskData) {
    const { user_id, title, due_date, priority } = taskData;
    const query = `
      INSERT INTO tasks (user_id, title, due_date, priority)
      VALUES ($1, $2, $3, $4) RETURNING *`;
    const result = await db.query(query, [user_id, title, due_date, priority]);
    return result.rows[0];
  },

  // Get and Sort Tasks
  async getCategorizedTasks(userId) {
    const query = 'SELECT * FROM tasks WHERE user_id = $1 ORDER BY due_date ASC';
    const { rows } = await db.query(query, [userId]);

    const now = new Date();
    const todayStr = now.toDateString();
    
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    return {
      today: rows.filter(t => new Date(t.due_date).toDateString() === todayStr && t.status !== 'completed'),
      thisWeek: rows.filter(t => {
        const d = new Date(t.due_date);
        return d > now && d <= nextWeek && d.toDateString() !== todayStr && t.status !== 'completed';
      }),
      upcoming: rows.filter(t => new Date(t.due_date) > nextWeek && t.status !== 'completed'),
      completed: rows.filter(t => t.status === 'completed')
    };
  },

  // Toggle Status
  async toggleTaskStatus(taskId, userId) {
    const query = `
      UPDATE tasks 
      SET status = CASE WHEN status = 'pending' THEN 'completed' ELSE 'pending' END,
          completed_at = CASE WHEN status = 'pending' THEN NOW() ELSE NULL END
      WHERE id = $1 AND user_id = $2 RETURNING *`;
    const result = await db.query(query, [taskId, userId]);
    return result.rows[0];
  },

  // Delete Task
  async deleteTask(taskId, userId) {
    await db.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
    return { message: "Task deleted successfully" };
  }
};

module.exports = ToDoService;

/*
// --- COMPLETE END-TO-END TEST ---
(async () => {
    const TEST_USER_ID = 1;

    try {
        console.log("--- Starting To-Do Service Test ---");

        // 1. Create a task for TODAY
        const task1 = await ToDoService.createTask({
            user_id: TEST_USER_ID,
            title: "Task for Today",
            due_date: new Date().toISOString(),
            priority: "High"
        });
        console.log("✅ Created Today's Task:", task1.id);

        // 2. Create a task for NEXT WEEK
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 3);
        const task2 = await ToDoService.createTask({
            user_id: TEST_USER_ID,
            title: "Task for Later this Week",
            due_date: futureDate.toISOString(),
            priority: "Medium"
        });
        console.log("✅ Created Future Task:", task2.id);

        // 3. Test Categorization (The Sorting Logic)
        const categories = await ToDoService.getCategorizedTasks(TEST_USER_ID);
        console.log("📊 Sorting Test:");
        console.log(`   - Today: ${categories.today.length} task(s)`);
        console.log(`   - This Week: ${categories.thisWeek.length} task(s)`);

        // 4. Test Toggle (Mark Today's task as Completed)
        const updated = await ToDoService.toggleTaskStatus(task1.id, TEST_USER_ID);
        console.log(`✅ Toggled Task ${task1.id}. New Status: ${updated.status}`);

        // 5. Test Delete (Clean up the future task)
        const deletion = await ToDoService.deleteTask(task2.id, TEST_USER_ID);
        console.log(`🗑️ ${deletion.message}`);

        console.log("--- All Tests Passed Successfully! ---");

    } catch (err) {
        console.error("❌ Test Failed:", err.message);
        console.error("Tip: Make sure User ID 1 exists in your 'users' table!");
    } finally {
        // Optional: process.exit(0); // Closes the terminal automatically
    }
})();
*/