import React, { useState, useEffect, useCallback } from 'react';
import './ToDo.css';

const API_URL = '/api/todo';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDateOnly(dateStr) {
  if (!dateStr) return null;
  const [datePart] = dateStr.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDueDate(dateStr) {
  const d = parseDateOnly(dateStr);
  return d
    ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
}

function formatCompletedAt(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toInputDate(dateStr) {
  const d = parseDateOnly(dateStr);
  return d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    : '';
}

function priorityStyle(priority) {
  switch ((priority || '').toLowerCase()) {
    case 'high':   return { bg: '#fdecea', color: '#c0392b' };
    case 'medium': return { bg: '#fef3e2', color: '#d4820a' };
    case 'low':    return { bg: '#eaf6ee', color: '#27ae60' };
    default:       return { bg: '#f0f0f0', color: '#999' };
  }
}

// ─── Streak Widget ────────────────────────────────────────────────────────────
 
function StreakWidget({ lastUpdated }) {
  const [streak, setStreak] = useState(null);
  const [prevStreak, setPrevStreak] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
 
  useEffect(() => {
    fetch('/api/progress/streak', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setStreak(data);
        if (data.rewardsUnlocked && prevStreak !== null && !prevStreak.rewardsUnlocked) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }
        setPrevStreak(data);
      })
      .catch(() => {});
  }, [lastUpdated]);
 
  if (!streak) return null;
 
  const { currentStreak, rewardsUnlocked } = streak;
  const filledDots = Math.min(currentStreak, 7);
 
  return (
    <div className="streak-widget streak-widget--minimal">
      <div className="streak-dots streak-dots--minimal">
        {Array.from({ length: 7 }).map((_, i) => (
          <span
            key={i}
            className={`streak-dot ${i < filledDots ? 'streak-dot--filled' : 'streak-dot--empty'}`}
            aria-label={`Day ${i + 1}${i < filledDots ? ' completed' : ''}`}
          >
            {i < filledDots ? '🔥' : '○'}
          </span>
        ))}
      </div>
      <p className="streak-minor-msg">
        {rewardsUnlocked
          ? `7-day streak unlocked!` 
          : `${currentStreak} day${currentStreak !== 1 ? 's' : ''} streak`}
      </p>
    </div>
  );
}

// ─── Task Modal (Add / Edit) ──────────────────────────────────────────────────

function TaskModal({ mode, task, onClose, onSave }) {
  const [title, setTitle]       = useState(task?.title || '');
  const [dueDate, setDueDate]   = useState(task?.due_date ? toInputDate(task.due_date) : '');
  const [priority, setPriority] = useState(task?.priority || 'Medium');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

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
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>{mode === 'add' ? 'Add New Task' : 'Edit Task'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label htmlFor="task-title">Task Title <span className="required">*</span></label>
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
            <label htmlFor="task-due">Due Date <span className="required">*</span></label>
            <input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>

          <div className="modal-field">
            <label htmlFor="task-priority">Priority</label>
            <select id="task-priority" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {error && <div className="modal-error" role="alert">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading
                ? <span className="btn-loading"><span className="spinner" /> Saving…</span>
                : mode === 'add' ? '+ Add Task' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onToggle, onDelete, onEdit }) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ps = priorityStyle(task.priority);

  const handleToggle = async (e) => {
    e.stopPropagation();
    setToggling(true);
    await onToggle(task.id);
    setToggling(false);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setDeleting(true);
    await onDelete(task.id);
  };

  return (
    <div
      className={`task-card ${deleting ? 'task-card--deleting' : ''}`}
      onClick={() => onEdit(task)}
      title="Click to edit"
    >
      {/* Checkbox */}
      <button
        className={`task-check ${toggling ? 'task-check--loading' : ''} ${task.status === 'completed' ? 'task-check--done' : ''}`}
        onClick={handleToggle}
        disabled={toggling}
        aria-label={task.status === 'completed' ? 'Mark as pending' : 'Mark as complete'}
      >
        {task.status === 'completed' && '✓'}
      </button>

      {/* Text */}
      <div className="task-body">
        <span className="task-title">{task.title}</span>
        {task.due_date && (
          <span className="task-due">📅 {formatDueDate(task.due_date)}</span>
        )}
      </div>

      {/* Priority badge */}
      {task.priority && (
        <span
          className="task-priority"
          style={{ background: ps.bg, color: ps.color }}
        >
          {task.priority}
        </span>
      )}

      {/* Delete */}
      <button
        className="task-delete"
        onClick={handleDelete}
        disabled={deleting}
        aria-label="Delete task"
      >
        {deleting ? '…' : '✕'}
      </button>
    </div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

function TaskColumn({ title, emoji, tasks, onToggle, onDelete, onEdit }) {
  return (
    <div className="task-column">
      <div className="column-header">
        <span>{emoji}</span>
        <h3 className="column-title">{title}</h3>
        {tasks.length > 0 && <span className="column-count">{tasks.length}</span>}
      </div>
      <div className="column-body">
        {tasks.length === 0
          ? <p className="column-empty">No tasks yet</p>
          : tasks.map(t => (
              <TaskCard
                key={t.id}
                task={t}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))
        }
      </div>
    </div>
  );
}

// ─── Completed Section ────────────────────────────────────────────────────────

function CompletedSection({ tasks, onToggle, onDelete }) {
  return (
    <div className="completed-section">
      <h2 className="completed-title">Completed Tasks </h2>

      {tasks.length === 0 ? (
        <p className="completed-empty">
          You have 0 recently completed tasks. Complete a task to see it here!
        </p>
      ) : (
        <>
          <p className="completed-subtitle">
            Showing your {tasks.length} most recently completed task{tasks.length !== 1 ? 's' : ''}
          </p>
          <div className="completed-list">
            {tasks.map(task => {
              const ps = priorityStyle(task.priority);
              return (
                <div key={task.id} className="completed-card">
                  <button
                    className="task-check task-check--done"
                    onClick={() => onToggle(task.id)}
                    aria-label="Mark as pending"
                  >✓</button>

                  <div className="task-body">
                    <span className="task-title task-title--done">{task.title}</span>
                    <span className="task-due completed-at">
                      ✅ Completed {formatCompletedAt(task.completed_at)}
                    </span>
                    {task.due_date && (
                      <span className="task-due">
                        due {formatDueDate(task.due_date)}
                      </span>
                    )}
                  </div>

                  {task.priority && (
                    <span className="task-priority" style={{ background: ps.bg, color: ps.color }}>
                      {task.priority}
                    </span>
                  )}

                  <button
                    className="task-delete"
                    onClick={() => onDelete(task.id)}
                    aria-label="Delete task"
                  >✕</button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function ToDo({ onTaskChange, lastUpdated }) {
  const [tasks, setTasks]       = useState({ today: [], thisWeek: [], upcoming: [], completed: [] });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [modal, setModal]       = useState(null); // null | { mode: 'add' } | { mode: 'edit', task }

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(API_URL, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      setTasks(await res.json());
    } catch {
      setError('Could not load tasks. Is the server running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks, lastUpdated]);

  // ── Create ────────────────────────────────────────────────────────────────
  const handleAdd = async ({ title, due_date, priority }) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, due_date, priority }),
      });
      if (!res.ok) throw new Error();
      setModal(null);
      await fetchTasks();
      if (onTaskChange) onTaskChange();
    } catch {
      setError('Could not create task.');
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleEdit = async ({ title, due_date, priority }) => {
    try {
      const res = await fetch(`${API_URL}/${modal.task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, due_date, priority }),
      });
      if (!res.ok) throw new Error();
      setModal(null);
      await fetchTasks();
      if (onTaskChange) onTaskChange();
    } catch {
      setError('Could not update task.');
    }
  };

  // ── Toggle ────────────────────────────────────────────────────────────────
  const handleToggle = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}/toggle`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      await fetchTasks();
      if (onTaskChange) onTaskChange();
    } catch {
      setError('Could not update task.');
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      await fetchTasks();
      if (onTaskChange) onTaskChange();
    } catch {
      setError('Could not delete task.');
    }
  };

  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const activeCount = tasks.today.length + tasks.thisWeek.length + tasks.upcoming.length;

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
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="todo-header">
        <div>
          <h1 className="todo-title">To-Do List</h1>
          <p className="todo-date">{dateLabel} 🌸</p>
        </div>
        {activeCount > 0 && (
          <span className="todo-summary">
            {activeCount} task{activeCount !== 1 ? 's' : ''} remaining
          </span>
        )}
      </div>

      <StreakWidget lastUpdated={lastUpdated} />

      {error && (
        <div className="todo-error" role="alert">
          {error}
          <button onClick={() => setError('')} aria-label="Dismiss">✕</button>
        </div>
      )}

      {/* ── Three columns ──────────────────────────────────────────────── */}
      <div className="todo-columns">
        <TaskColumn title="Today"
          tasks={tasks.today}
          onToggle={handleToggle} onDelete={handleDelete}
          onEdit={(task) => setModal({ mode: 'edit', task })}
        />
        <TaskColumn title="This Week"
          tasks={tasks.thisWeek}
          onToggle={handleToggle} onDelete={handleDelete}
          onEdit={(task) => setModal({ mode: 'edit', task })}
        />
        <TaskColumn title="Upcoming"
          tasks={tasks.upcoming}
          onToggle={handleToggle} onDelete={handleDelete}
          onEdit={(task) => setModal({ mode: 'edit', task })}
        />
      </div>

      {/* ── Completed ──────────────────────────────────────────────────── */}
      <CompletedSection
        tasks={tasks.completed}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />

      {/* ── FAB ────────────────────────────────────────────────────────── */}
      <button className="fab" onClick={() => setModal({ mode: 'add' })} aria-label="Add new task">
        +
      </button>

      {/* ── Modal ──────────────────────────────────────────────────────── */}
      {modal && (
        <TaskModal
          mode={modal.mode}
          task={modal.task || null}
          onClose={() => setModal(null)}
          onSave={modal.mode === 'add' ? handleAdd : handleEdit}
        />
      )}
    </div>
  );
}

export default ToDo;
