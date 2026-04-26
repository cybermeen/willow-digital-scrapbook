const express = require('express');
const router = express.Router();
const ToDoService = require('../services/to-doService');
const auth = require('../auth/auth');

// Apply auth middleware to all routes
router.use(auth);

// GET all tasks (categorized)
router.get('/', async (req, res) => {
  try {
    const tasks = await ToDoService.getCategorizedTasks(req.session.userId);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create task
router.post('/', async (req, res) => {
  try {
    const newTask = await ToDoService.createTask(req.body, req.session.userId);
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT edit task
router.put('/:id', async (req, res) => {
  try {
    const updated = await ToDoService.updateTask(req.params.id, req.body, req.session.userId);
    if (!updated) return res.status(404).json({ error: 'Task not found.' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH toggle completion
router.patch('/:id/toggle', async (req, res) => {
  try {
    const updated = await ToDoService.toggleTaskStatus(req.params.id, req.session.userId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE task
router.delete('/:id', async (req, res) => {
  try {
    const response = await ToDoService.deleteTask(req.params.id, req.session.userId);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
