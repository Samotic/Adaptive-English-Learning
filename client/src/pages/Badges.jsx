import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';

export default function Badges({ token, user }) {
  const [gamification, setGamification] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('badges'); // 'badges' or 'leaderboard'

  useEffect(() => {
    loadGamificationData();
  }, []);

  async function loadGamificationData() {
    try {
      const [gamifRes, leaderRes] = await Promise.all([
        apiFetch(`/api/gamification/user/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        apiFetch('/api/gamification/leaderboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (gamifRes.ok) {
        const gamifData = await gamifRes.json();
        setGamification(gamifData);
      }

      if (leaderRes.ok) {
        const leaderData = await leaderRes.json();
        setLeaderboard(leaderData);
      }
    } catch (e) {
      console.error('Failed to load gamification data:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="badges-page"><div className="loading">Loading achievements...</div></div>;
  }

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#95a5a6',
      uncommon: '#3498db',
      rare: '#9b59b6',
      epic: '#e74c3c',
      legendary: '#f39c12'
    };
    return colors[rarity] || colors.common;
  };

  const getRarityGlow = (rarity) => {
    const colors = {
      common: 'rgba(149, 165, 166, 0.3)',
      uncommon: 'rgba(52, 152, 219, 0.3)',
      rare: 'rgba(155, 89, 182, 0.3)',
      epic: 'rgba(231, 76, 60, 0.3)',
      legendary: 'rgba(243, 156, 18, 0.3)'
    };
    return colors[rarity] || colors.common;
  };

  return (
    <div className="badges-page">
      <div className="badges-container">
        <h1>🏆 Achievements & Leaderboard</h1>
        
        {/* Stats Summary */}
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">💎</div>
            <div className="stat-content">
              <div className="stat-value">{gamification?.totalPoints || 0}</div>
              <div className="stat-label">Total Points</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏅</div>
            <div className="stat-content">
              <div className="stat-value">{gamification?.totalBadges || 0}</div>
              <div className="stat-label">Badges Earned</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <div className="stat-value">{gamification?.streak || 0}</div>
              <div className="stat-label">Day Streak</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'badges' ? 'active' : ''}`}
            onClick={() => setActiveTab('badges')}
          >
            🏅 My Badges
          </button>
          <button
            className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            👑 Leaderboard
          </button>
        </div>

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div className="badges-content">
            {gamification?.badges && gamification.badges.length > 0 ? (
              <div className="badges-grid">
                {gamification.badges.map((badge, index) => (
                  <div
                    key={index}
                    className={`badge-card badge-${badge.rarity}`}
                  >
                    <div className="badge-icon">{badge.icon}</div>
                    <h3 className="badge-name">{badge.name}</h3>
                    <p className="badge-description">{badge.description}</p>
                    <div className="badge-meta">
                      <span
                        className={`badge-rarity badge-rarity-${badge.rarity}`}
                      >
                        {badge.rarity}
                      </span>
                      <span className="badge-points">+{badge.points} pts</span>
                    </div>
                    <div className="badge-earned">
                      Earned: {new Date(badge.earnedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🎯</div>
                <h3>No Badges Yet</h3>
                <p>Complete lessons and quizzes to earn your first badge!</p>
              </div>
            )}

            {/* Rarity Breakdown */}
            {gamification?.badgesByRarity && (
              <div className="rarity-breakdown">
                <h3>Badges by Rarity</h3>
                <div className="rarity-bars">
                  {Object.entries(gamification.badgesByRarity).map(([rarity, count]) => (
                    <div key={rarity} className="rarity-bar-item">
                      <span className="rarity-name">{rarity}</span>
                      <div className="rarity-bar-bg">
                        <div
                          className={`rarity-bar-fill rarity-bar-${rarity}`}
                          style={{ width: `${(count / gamification.totalBadges) * 100}%` }}
                        />
                      </div>
                      <span className="rarity-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="leaderboard-content">
            {leaderboard.length > 0 ? (
              <div className="leaderboard-table">
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.username === user.username;
                  const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                  
                  return (
                    <div
                      key={index}
                      className={`leaderboard-row ${isCurrentUser ? 'current-user' : ''}`}
                    >
                      <div className="rank">
                        {rankIcon || `#${entry.rank}`}
                      </div>
                      <div className="user-info">
                        <div className="user-name">{entry.name}</div>
                        <div className="user-stats">
                          {entry.badges} badges • θ={entry.theta}
                        </div>
                      </div>
                      <div className="user-points">
                        <div className="points-value">{entry.points}</div>
                        <div className="points-label">points</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👑</div>
                <h3>Leaderboard Empty</h3>
                <p>Be the first to earn points and climb to the top!</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .badges-page {
          padding: 40px 20px;
          max-width: 1200px;
          margin: 0 auto;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .badges-container h1 {
          font-size: 36px;
          margin-bottom: 32px;
          text-align: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .stats-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }

        .stat-icon {
          font-size: 48px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 800;
          color: #667eea;
        }

        .stat-label {
          font-size: 14px;
          color: #666;
        }

        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 2px solid #e0e0e0;
        }

        .tab {
          padding: 12px 24px;
          border: none;
          background: none;
          font-size: 16px;
          font-weight: 600;
          color: #666;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
        }

        .tab.active {
          color: #667eea;
          border-bottom-color: #667eea;
        }

        .tab:hover:not(.active) {
          color: #333;
        }

        .badges-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .badge-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          border: 3px solid;
          transition: transform 0.3s;
        }

        .badge-card:hover {
          transform: translateY(-4px);
        }

        .badge-icon {
          font-size: 64px;
          margin-bottom: 12px;
        }

        .badge-name {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #333;
        }

        .badge-description {
          font-size: 14px;
          color: #666;
          margin-bottom: 12px;
        }

        .badge-meta {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .badge-rarity {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
        }

        .badge-points {
          padding: 4px 12px;
          background: #f0f0f0;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          color: #667eea;
        }

        .badge-earned {
          font-size: 12px;
          color: #999;
        }

        .rarity-breakdown {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }

        .rarity-breakdown h3 {
          margin-bottom: 16px;
        }

        .rarity-bars {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .rarity-bar-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .rarity-name {
          width: 100px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .rarity-bar-bg {
          flex: 1;
          height: 24px;
          background: #f0f0f0;
          border-radius: 12px;
          overflow: hidden;
        }

        .rarity-bar-fill {
          height: 100%;
          transition: width 0.5s;
        }

        .rarity-count {
          width: 40px;
          text-align: right;
          font-weight: 700;
        }

        .leaderboard-table {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }

        .leaderboard-row {
          display: flex;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.3s;
        }

        .leaderboard-row:hover {
          background: #f8f9fa;
        }

        .leaderboard-row.current-user {
          background: linear-gradient(90deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
          border-left: 4px solid #667eea;
        }

        .rank {
          width: 60px;
          font-size: 24px;
          font-weight: 800;
          text-align: center;
        }

        .user-info {
          flex: 1;
        }

        .user-name {
          font-size: 18px;
          font-weight: 700;
          color: #333;
        }

        .user-stats {
          font-size: 14px;
          color: #666;
        }

        .user-points {
          text-align: right;
        }

        .points-value {
          font-size: 24px;
          font-weight: 800;
          color: #667eea;
        }

        .points-label {
          font-size: 12px;
          color: #666;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }

        .empty-icon {
          font-size: 80px;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          font-size: 24px;
          margin-bottom: 8px;
          color: #333;
        }

        .empty-state p {
          color: #666;
        }

        .loading {
          text-align: center;
          padding: 60px;
          font-size: 18px;
          color: #666;
        }
      `}</style>
    </div>
  );
}
