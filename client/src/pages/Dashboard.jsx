import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkNeedsGeneration } from '../api';
import LearningPath from './LearningPath';
import InitialPathGenerator from '../components/InitialPathGenerator';

const NAV_LINKS = [
  { label: 'Badges', path: '/badges' },
  { label: 'Calendar', path: '/calendar' },
  { label: 'Support', path: '/support' },
  { label: 'Privacy', path: '/privacy' },
  { label: 'Account', path: '/account' }
];

export default function Dashboard({ token, user, onLogout }) {
  const navigate = useNavigate();
  const [needsPathGeneration, setNeedsPathGeneration] = useState(false);
  const [checkingPath, setCheckingPath] = useState(true);
  const [showPath, setShowPath] = useState(true);

  useEffect(() => {
    let cancelled = false;
    checkNeedsGeneration(token)
      .then((result) => {
        if (!cancelled) setNeedsPathGeneration(result.needsGeneration);
      })
      .catch((e) => console.error('Failed to check path generation:', e))
      .finally(() => {
        if (!cancelled) setCheckingPath(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (checkingPath) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading-wrapper">
          <div className="dashboard-spinner" />
          <p className="dashboard-spinner-text">Setting up your dashboard...</p>
        </div>
      </div>
    );
  }

  if (needsPathGeneration) {
    return (
      <div className="dashboard-container">
        <InitialPathGenerator token={token} onComplete={() => setNeedsPathGeneration(false)} />
      </div>
    );
  }

  return (
    <div className="dashboard-full">
      <nav className="dashboard-nav">
        <div className="dashboard-nav-container">
          <h1 className="dashboard-title">📖 Adaptive English</h1>
          <div className="dashboard-nav-links">
            <button className="nav-link" onClick={() => setShowPath((s) => !s)}>Learning Path</button>
            {NAV_LINKS.map((link) => (
              <button key={link.path} className="nav-link" onClick={() => navigate(link.path)}>{link.label}</button>
            ))}
            <button className="btn-logout" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h2 className="welcome-text">Welcome back, {user?.username}! 👋</h2>
          <p className="welcome-subtitle">Ready to continue your English learning journey?</p>
        </div>

        {showPath && (
          <div className="content-panel">
            <LearningPath token={token} />
          </div>
        )}
      </div>
    </div>
  );
}
