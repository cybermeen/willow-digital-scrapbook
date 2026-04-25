import React, { useState, useEffect, useCallback } from 'react';
import './ToDo.css';

const API_URL = 'http://localhost:5000/api/todo';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function priorityColor(priority) {
  if (!priority) return '#c0cfc0';
  switch (priority.toLowerCase()) {
    case 'high':   return '#c0392b';
    case 'medium': return '#e67e22';
    case 'low':    return '#27ae60';
    default:       return '#c0cfc0';
  }
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onToggle, onDelete, onEdit }) {
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await onToggle(task.id);
    setToggling(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(task.id);
  };

  return (
    <div className={`task-card ${task.status === 'completed' ? 'task-card--completed' : ''}`}>
      <button
        className={`task-check ${toggling ? 'task-check--loading' : ''} ${task.status === 'completed' ? 'task-check--done' : ''}`}
        onClick={handleToggle}
        title={task.status === 'completed' ? 'Mark as pending' : 'Mark as complete'}
        disabled={toggling}
      >
        {task.status === 'completed' ? '✓' : ''}
      </button>

      <div className="task-body">
        <span className="task-title">{task.title}</span>
        {task.due_date && (
          <span className="task-due">Due {formatDate(task.due_date)}</span>
        )}
      </div>

      <div className="task-meta">
        {task.priority && (
          <span
            className="task-priority"
            style={{ background: priorityColor(task.priority) + '22', color: priorityColor(task.priority) }}
          >
            {task.priority}
          </span>
        )}
        <button className="task-action task-action--edit" onClick={() => onEdit(task)} title="Edit task">✏️</button>
        <button className="task-action task-action--delete" onClick={handleDelete} disabled={deleting} title="Delete task">
          {deleting ? '…' : '🗑'}
        </button>
      </div>
    </div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

function TaskColumn({ title, emoji, tasks, onToggle, onDelete, onEdit }) {
  return (
    <div className="task-column">
      <div className="column-header">
        <span className="column-emoji">{emoji}</span>
        <h3 className="column-title">{title}</h3>
        <span className="column-count">{tasks.length}</span>
      </div>
      <div className="column-body">
        {tasks.length === 0 ? (
          <p className="column-empty">No tasks yet</p>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

function TaskModal({ mode, task, onClose, onSave }) {
  const [title, setTitle] = useState(task?.title || '');
  const [dueDate, setDueDate] = useState(
    task?.due_date ? task.due_date.split('T')[0] : ''
  );
  const [priority, setPriority] = useState(task?.priority || 'Medium');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Task title is required.'); return; }
    if (!dueDate)       { setError('Due date is required.'); return; }
    setError('');
    setLoading(true);
    await onSave({ title: title.trim(), due_date: dueDate, priority });
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{mode === 'add' ? 'Add New Task' : 'Edit Task'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label htmlFor="task-title">
              Task Title <span className="required">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              placeholder="What do you want to accomplish?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="modal-field">
            <label htmlFor="task-due">
              Due Date <span className="required">*</span>
            </label>
            <input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>

          <div className="modal-field">
            <label htmlFor="task-priority">Priority</label>
            <select
              id="task-priority"
              value={priority}
              onChange={e => setPriority(e.target.value)}
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {error && <div className="modal-error">{error}</div>}

          {/* NOTE: Edit functionality requires a PUT /api/todo/:id endpoint
              to be added to the backend before it will work. */}
          {mode === 'edit' && (
            <p className="modal-notice">
              ⚠️ Edit requires a backend endpoint — coming soon.
            </p>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="btn-save"
              disabled={loading || mode === 'edit'}
            >
              {loading
                ? <span className="btn-loading"><span className="spinner-dark" />Saving…</span>
                : mode === 'add' ? '+ Add Task' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main ToDo Component ──────────────────────────────────────────────────────

function ToDo() {
  const [tasks, setTasks] = useState({ today: [], thisWeek: [], upcoming: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null); // null = add mode, task object = edit mode

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(API_URL, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      setError('Could not load tasks. Is the server running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleAddTask = async ({ title, due_date, priority }) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, due_date, priority }),
      });
      if (!res.ok) throw new Error('Failed to create task');
      setShowModal(false);
      await fetchTasks();
    } catch (err) {
      setError('Could not create task.');
    }
  };

  // ── Toggle ──────────────────────────────────────────────────────────────────
  const handleToggle = async (taskId) => {
    try {
      const res = await fetch(`${API_URL}/${taskId}/toggle`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to toggle task');
      await fetchTasks();
    } catch (err) {
      setError('Could not update task.');
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (taskId) => {
    try {
      const res = await fetch(`${API_URL}/${taskId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete task');
      await fetchTasks();
    } catch (err) {
      setError('Could not delete task.');
    }
  };

  // ── Edit (opens modal, saving requires backend endpoint) ────────────────────
  const handleEdit = (task) => { setEditTask(task); };
  const handleCloseModal = () => { setShowModal(false); setEditTask(null); };

  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const totalActive = tasks.today.length + tasks.thisWeek.length + tasks.upcoming.length;

  if (loading) {
    return (
      <div className="todo-loading">
        <span className="loading-leaf">🌿</span>
        <p>Loading your tasks…</p>
      </div>
    );
  }

  return (
    <div className="todo">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="todo-header">
        <div>
          <h1 className="todo-title">To-Do List</h1>
          <p className="todo-date">{dateLabel} 🌸</p>
        </div>
        {totalActive > 0 && (
          <p className="todo-summary">{totalActive} task{totalActive !== 1 ? 's' : ''} remaining</p>
        )}
      </div>

      {error && (
        <div className="todo-error" role="alert">
          {error}
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* ── Three Columns ───────────────────────────────────────────────── */}
      <div className="todo-columns">
        <TaskColumn
          title="Today"     emoji="☀️"
          tasks={tasks.today}
          onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit}
        />
        <TaskColumn
          title="This Week" emoji="📅"
          tasks={tasks.thisWeek}
          onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit}
        />
        <TaskColumn
          title="Upcoming"  emoji="🔮"
          tasks={tasks.upcoming}
          onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit}
        />
      </div>

      {/* ── Completed Section ────────────────────────────────────────────── */}
      {tasks.completed.length > 0 && (
        <div className="completed-section">
          <h2 className="completed-title">Completed Tasks ✨</h2>
          <div className="completed-grid">
            {tasks.completed.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Floating Add Button ──────────────────────────────────────────── */}
      <button className="fab" onClick={() => setShowModal(true)} title="Add new task">+</button>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {showModal && (
        <TaskModal mode="add" task={null} onClose={handleCloseModal} onSave={handleAddTask} />
      )}
      {editTask && (
        <TaskModal mode="edit" task={editTask} onClose={handleCloseModal} onSave={() => {}} />
      )}
    </div>
  );
}

export default ToDo;
