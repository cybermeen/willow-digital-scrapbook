import React, { useState, useEffect } from 'react';
import Login from './Login';
import Signup from './Signup';
import Dashboard from './Dashboard';

const API_URL = 'http://localhost:5000/api/auth';

function App() {
  const [currentPage, setCurrentPage] = useState('loading');
  const [user, setUser] = useState(null);

  // On first load, check with the backend if a session cookie is still valid
  useEffect(() => {
    fetch(`${API_URL}/me`, {
      method: 'GET',
      credentials: 'include', // sends the session cookie automatically
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('No active session');
      })
      .then(data => {
        setUser(data.user);
        setCurrentPage('dashboard');
      })
      .catch(() => {
        setCurrentPage('login');
      });
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    fetch(`${API_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      setUser(null);
      setCurrentPage('login');
    });
  };

  if (currentPage === 'loading') {
    return (
      <div className="app-loading">
        <span className="loading-leaf">🌿</span>
      </div>
    );
  }

  return (
    <div className="app">
      {currentPage === 'login' && (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onSwitchToSignup={() => setCurrentPage('signup')}
        />
      )}

      {currentPage === 'signup' && (
        <Signup
          onSignupSuccess={handleLoginSuccess}
          onSwitchToLogin={() => setCurrentPage('login')}
        />
      )}

      {currentPage === 'dashboard' && (
        <Dashboard
          user={user}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
