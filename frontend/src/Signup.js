import React, { useState } from 'react';
import './Auth.css';

const API_URL = 'http://localhost:5000/api/auth';

function Signup({ onSignupSuccess, onSwitchToLogin }) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // required: receives the session cookie on registration
        body: JSON.stringify({ email, password, displayName }),
      });

      const data = await response.json();

      if (response.ok) {
        onSignupSuccess(data.user);
      } else {
        setError(data.message || 'Sign up failed. Please try again.');
      }
    } catch (err) {
      setError('Could not reach the server. Is it running?');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-panel auth-panel--deco">
        <div className="deco-content">
          <div className="deco-logo">🌿</div>
          <h1 className="deco-title">Willow</h1>
          <p className="deco-tagline">
            Every journey begins with
            <br />
            a single, gentle step.
          </p>
          <div className="deco-leaves" aria-hidden="true">
            <span className="leaf leaf-1">🍃</span>
            <span className="leaf leaf-2">🌱</span>
            <span className="leaf leaf-3">🍀</span>
          </div>
        </div>
      </div>

      <div className="auth-panel auth-panel--form">
        <div className="form-wrapper">
          <div className="form-header">
            <h2>Join Willow</h2>
            <p>Create your account to get started</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="signup-name">Display Name</label>
              <input
                id="signup-name"
                type="text"
                placeholder="How should we call you?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-email">Email Address</label>
              <input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner" />
                  Creating account…
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="form-footer">
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={onSwitchToLogin}
              >
                Log in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
