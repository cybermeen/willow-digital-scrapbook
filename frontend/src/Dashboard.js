import React, { useState } from 'react';
import ToDo from './ToDo';
import Progress from './Progress';
import DayLog from './DayLog';
import Scrapbook from './Scrapbook';
import './Dashboard.css';

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('todo');

  const navItems = [
    { id: 'daylog',    label: 'Day Log' },
    { id: 'today',     label: 'Today' },
    { id: 'todo',      label: 'To-Do' },
    { id: 'scrapbook', label: 'Scrapbook' },
  ];

  const initials = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || '?';

  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const handleTaskChange = () => setLastUpdated(Date.now());

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
        {activeTab === 'today'     && <Progress lastUpdated={lastUpdated} />}
        {activeTab === 'todo'      && <ToDo user={user} onTaskChange={handleTaskChange} />}
        {activeTab === 'daylog'    && <DayLog user={user} />}
        {activeTab === 'scrapbook' && <Scrapbook user={user} />}
      </main>
    </div>
  );
}

export default Dashboard;
