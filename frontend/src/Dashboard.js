import React from 'react';
import './Dashboard.css';

function Dashboard({ user, onLogout }) {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-logo">
          <span>🌿</span>
          <span className="dashboard-logo-name">Willow</span>
        </div>
        <div className="dashboard-user">
          <span className="dashboard-greeting">
            Hello, {user?.displayName || user?.email || 'there'} 👋
          </span>
          <button className="btn-logout" onClick={onLogout}>
            Log Out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-welcome">
          <h1>You're in. 🌱</h1>
          <p>
            Your dashboard is coming soon. Tasks, progress, and more —
            all in one place.
          </p>
          <div className="dashboard-placeholder">
            <div className="placeholder-card">📋 Tasks</div>
            <div className="placeholder-card">📈 Progress</div>
            <div className="placeholder-card">📖 Scrapbook</div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
