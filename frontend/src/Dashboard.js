import React, { useState } from 'react';
import ToDo from './ToDo';
import DayLog from './DayLog';
import Scrapbook from './Scrapbook';
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
          <div className="today-panel">
            <h2>Good day, {user?.displayName || user?.email || 'Friend'}!</h2>
            <p>Your Today dashboard is ready to help you relax and reflect.</p>
            <div className="today-actions">
              <button className="btn-primary" onClick={() => setActiveTab('daylog')}>
                Open Day Log
              </button>
              <button className="btn-secondary" onClick={() => setActiveTab('todo')}>
                View To-Do
              </button>
            </div>
          </div>
        )}
        {activeTab === 'daylog' && <DayLog user={user} />}
        {activeTab === 'scrapbook' && <Scrapbook user={user} />}
      </main>
    </div>
  );
}

export default Dashboard;
