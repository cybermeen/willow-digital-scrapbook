import React, { useState } from 'react';
import ToDo from './ToDo';
import './Dashboard.css';

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('todo');

  const navItems = [
    { id: 'today',    label: '🌤 Today' },
    { id: 'daylog',   label: '📓 Day Log' },
    { id: 'todo',     label: '✅ To-Do' },
    { id: 'scrapbook',label: '📌 Scrapbook' },
  ];

  const initials = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-logo">
          <span>🌿</span>
          <span className="dashboard-logo-name">Willow</span>
        </div>

        <nav className="dashboard-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-btn ${activeTab === item.id ? 'nav-btn--active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="dashboard-user">
          <div className="user-avatar" title={user?.displayName || user?.email}>
            {initials}
          </div>
          <button className="btn-logout" onClick={onLogout}>Log Out</button>
        </div>
      </header>

      <main className="dashboard-main">
        {activeTab === 'todo' && <ToDo user={user} />}

        {activeTab === 'today' && (
          <div className="coming-soon">
            <span>🌤</span>
            <h2>Today</h2>
            <p>Coming soon</p>
          </div>
        )}
        {activeTab === 'daylog' && (
          <div className="coming-soon">
            <span>📓</span>
            <h2>Day Log</h2>
            <p>Coming soon</p>
          </div>
        )}
        {activeTab === 'scrapbook' && (
          <div className="coming-soon">
            <span>📌</span>
            <h2>Scrapbook</h2>
            <p>Coming soon</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
