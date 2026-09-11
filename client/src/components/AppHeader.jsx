import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AppHeader({ user, onLogout }) {
  const navigate = useNavigate();
  return (
    <nav className="dashboard-nav">
      <div className="dashboard-nav-container">
        <h1 className="dashboard-title">📖 Adaptive English</h1>
        <div className="dashboard-nav-links">
          <button className="nav-link" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button className="nav-link" onClick={() => navigate('/learning-path')}>Learning Path</button>
          <button className="nav-link" onClick={() => navigate('/support')}>Support</button>
          <button className="nav-link" onClick={() => navigate('/account')}>Account</button>
          <button className="btn-logout" onClick={onLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}
