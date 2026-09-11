import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import '../styles.css';

export default function MonitoringDashboard({ token }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds default
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const fetchDashboardData = async () => {
    try {
      const res = await apiFetch('/api/monitoring/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="monitoring-loading">
        <h2>Loading monitoring data...</h2>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="monitoring-error">
        <h2>Failed to load monitoring data</h2>
      </div>
    );
  }

  const { health, performance, endpoints, system } = dashboardData;

  const getStatusColor = (status) => {
    const colors = {
      healthy: '#27ae60',
      degraded: '#f39c12',
      unhealthy: '#e74c3c',
      warning: '#f39c12',
      error: '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };

  const getStatusIcon = (status) => {
    const icons = {
      healthy: '✅',
      degraded: '⚠️',
      unhealthy: '❌',
      warning: '⚠️',
      error: '❌'
    };
    return icons[status] || '❓';
  };

  return (
    <div className="monitoring-container">
      {/* Header */}
      <div className="monitoring-header">
        <h1>📊 System Monitoring</h1>
        <div className="monitoring-controls">
          <label className="auto-refresh-label">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            disabled={!autoRefresh}
            className="refresh-interval-select"
          >
            <option value={1000}>1s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
          </select>
          <button
            onClick={fetchDashboardData}
            className="refresh-btn"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Overall Health Status */}
      <div className={`health-status-card health-${health.status}`}>
        <div className="health-header">
          <span className="health-icon">{getStatusIcon(health.status)}</span>
          <div className="health-info">
            <h2>System Status: {health.status.toUpperCase()}</h2>
            <p className="health-timestamp">
              Last check: {new Date(health.lastCheck).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Health Checks Grid */}
        <div className="health-checks-grid">
          {Object.entries(health.checks).map(([name, check]) => (
            <div
              key={name}
              className={`health-check-card health-check-${check.status}`}
            >
              <div className="health-check-header">
                <strong className="health-check-name">{name}</strong>
                <span>{getStatusIcon(check.status)}</span>
              </div>
              <div className="health-check-details">
                {check.heapUsed && <div>Memory: {check.heapUsed} / {check.heapTotal} ({check.usagePercent})</div>}
                {check.formatted && <div>Uptime: {check.formatted}</div>}
                {check.connected !== undefined && <div>Connected: {check.connected ? 'Yes' : 'No'}</div>}
                {check.error && <div className="health-check-error">Error: {check.error}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="metrics-grid">
        {/* Requests */}
        <div className="metric-card">
          <h3 className="metric-title">📈 Requests</h3>
          <div className="metric-stats">
            <div className="metric-stat">
              <span>Total:</span>
              <strong>{performance.requests.total.toLocaleString()}</strong>
            </div>
            <div className="metric-stat">
              <span>Success:</span>
              <strong className="text-success">{performance.requests.success.toLocaleString()}</strong>
            </div>
            <div className="metric-stat">
              <span>Errors:</span>
              <strong className="text-error">{performance.requests.errors.toLocaleString()}</strong>
            </div>
            <div className="metric-stat">
              <span>Success Rate:</span>
              <strong>{performance.requests.successRate}</strong>
            </div>
          </div>
        </div>

        {/* Response Time */}
        <div className="metric-card">
          <h3 className="metric-title">⚡ Response Time</h3>
          <div className="metric-stats">
            <div className="metric-stat">
              <span>Average:</span>
              <strong>{performance.responseTime.average}</strong>
            </div>
            <div className="metric-stat">
              <span>Min:</span>
              <strong className="text-success">{performance.responseTime.min}</strong>
            </div>
            <div className="metric-stat">
              <span>Max:</span>
              <strong className="text-error">{performance.responseTime.max}</strong>
            </div>
            <div className="metric-stat">
              <span>P95:</span>
              <strong>{performance.responseTime.p95}</strong>
            </div>
            <div className="metric-stat">
              <span>P99:</span>
              <strong>{performance.responseTime.p99}</strong>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="metric-card">
          <h3 className="metric-title">💻 System</h3>
          <div className="metric-stats">
            <div className="metric-stat">
              <span>Uptime:</span>
              <strong>{performance.uptime.formatted}</strong>
            </div>
            <div className="metric-stat">
              <span>Node Version:</span>
              <strong>{system.nodeVersion}</strong>
            </div>
            <div className="metric-stat">
              <span>Platform:</span>
              <strong>{system.platform}</strong>
            </div>
            <div className="metric-stat">
              <span>Process ID:</span>
              <strong>{system.pid}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Endpoint Metrics */}
      <div className="endpoints-card">
        <h3 className="endpoints-title">🎯 Endpoint Performance</h3>
        <div className="endpoints-table-wrapper">
          <table className="endpoints-table">
            <thead>
              <tr className="endpoints-table-header">
                <th className="text-left">Endpoint</th>
                <th className="text-right">Total</th>
                <th className="text-right">Success</th>
                <th className="text-right">Errors</th>
                <th className="text-right">Error Rate</th>
                <th className="text-right">Avg Response</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.slice(0, 20).map((endpoint, idx) => (
                <tr key={idx} className="endpoints-table-row">
                  <td className="endpoint-name">
                    {endpoint.endpoint}
                  </td>
                  <td className="text-right">
                    {endpoint.total.toLocaleString()}
                  </td>
                  <td className="text-right text-success">
                    {endpoint.success.toLocaleString()}
                  </td>
                  <td className={`text-right ${endpoint.errors > 0 ? 'text-error' : 'text-muted'}`}>
                    {endpoint.errors.toLocaleString()}
                  </td>
                  <td className={`text-right ${parseFloat(endpoint.errorRate) > 5 ? 'text-error' : 'text-muted'}`}>
                    {endpoint.errorRate}
                  </td>
                  <td className="text-right">
                    {endpoint.avgResponseTime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {endpoints.length > 20 && (
          <p className="endpoints-note">
            Showing top 20 of {endpoints.length} endpoints
          </p>
        )}
      </div>
    </div>
  );
}
