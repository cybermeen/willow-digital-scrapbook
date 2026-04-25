const express = require('express');
const router = express.Router();
const ToDoService = require('../services/to-doService');

// GET all tasks (categorized)
router.get('/:userId', async (req, res) => {
  try {
    const tasks = await ToDoService.getCategorizedTasks(req.params.userId);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create task
router.post('/', async (req, res) => {
  try {
    const newTask = await ToDoService.createTask(req.body);
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH toggle completion
router.patch('/:id/toggle', async (req, res) => {
  try {
    const updated = await ToDoService.toggleTaskStatus(req.params.id, req.body.user_id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE task
router.delete('/:id', async (req, res) => {
  try {
    const response = await ToDoService.deleteTask(req.params.id, req.body.user_id);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;