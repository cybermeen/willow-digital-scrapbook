const express = require('express');
const router = express.Router();
const auth = require('../auth/auth');
const ToDoService = require('../services/to-doService');

router.use(auth);

// GET all tasks (categorized)
router.get('/', async (req, res) => {
  try {
    const tasks = await ToDoService.getCategorizedTasks(req.user.id);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create task
router.post('/', async (req, res) => {
  try {
    const taskData = { user_id: req.user.id, ...req.body };
    const newTask = await ToDoService.createTask(taskData);
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH toggle completion
router.patch('/:id/toggle', async (req, res) => {
  try {
    const updated = await ToDoService.toggleTaskStatus(req.params.id, req.user.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE task
router.delete('/:id', async (req, res) => {
  try {
    const response = await ToDoService.deleteTask(req.params.id, req.user.id);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;