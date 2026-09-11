import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import '../styles.css';

/**
 * Training Data Dashboard (Admin Only)
 * View statistics and export anonymized training data for AI model retraining
 * UC18: Retrain/Update AI Models
 */
function TrainingDataDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportParams, setExportParams] = useState({
    startDate: '',
    endDate: '',
    interactionType: '',
    limit: 1000
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiFetch('/api/training-data/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
      if (exportParams.startDate) queryParams.append('startDate', exportParams.startDate);
      if (exportParams.endDate) queryParams.append('endDate', exportParams.endDate);
      if (exportParams.interactionType) queryParams.append('interactionType', exportParams.interactionType);
      if (exportParams.limit) queryParams.append('limit', exportParams.limit);

      const response = await apiFetch(
        `/api/training-data/export?${queryParams}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Download as JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { 
          type: 'application/json' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `training-data-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        alert(`Exported ${data.count} records successfully!`);
      } else {
        alert('Export failed. Check console for details.');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Export failed. Check console for details.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="training-data-dashboard">
        <h2>Training Data Dashboard</h2>
        <p>Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="training-data-dashboard">
      <h2>Training Data Dashboard</h2>
      <p className="subtitle">UC18: AI Model Retraining - Anonymized Data Collection</p>

      {stats && (
        <div className="stats-section">
          <h3>Dataset Statistics</h3>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.totalRecords.toLocaleString()}</div>
              <div className="stat-label">Total Records</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{stats.uniqueAnonymizedUsers}</div>
              <div className="stat-label">Unique Students (Anonymized)</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">
                {stats.dateRange?.earliest 
                  ? new Date(stats.dateRange.earliest).toLocaleDateString()
                  : 'N/A'}
              </div>
              <div className="stat-label">Earliest Record</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">
                {stats.dateRange?.latest 
                  ? new Date(stats.dateRange.latest).toLocaleDateString()
                  : 'N/A'}
              </div>
              <div className="stat-label">Latest Record</div>
            </div>
          </div>

          <div className="interaction-types">
            <h4>Interaction Types</h4>
            <table>
              <thead>
                <tr>
                  <th>Interaction Type</th>
                  <th>Count</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.interactionTypes || {}).map(([type, count]) => (
                  <tr key={type}>
                    <td>{type.replace(/_/g, ' ').toUpperCase()}</td>
                    <td>{count.toLocaleString()}</td>
                    <td>{((count / stats.totalRecords) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="export-section">
        <h3>Export Training Data</h3>
        <p className="info">
          Export anonymized training data for machine learning model development.
          All exported data is fully anonymized with hashed user IDs.
        </p>

        <div className="export-form">
          <div className="form-group">
            <label>Start Date:</label>
            <input
              type="date"
              value={exportParams.startDate}
              onChange={(e) => setExportParams({...exportParams, startDate: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>End Date:</label>
            <input
              type="date"
              value={exportParams.endDate}
              onChange={(e) => setExportParams({...exportParams, endDate: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Interaction Type:</label>
            <select
              value={exportParams.interactionType}
              onChange={(e) => setExportParams({...exportParams, interactionType: e.target.value})}
            >
              <option value="">All Types</option>
              <option value="quiz_answer">Quiz Answers</option>
              <option value="click">Clicks</option>
              <option value="page_view">Page Views</option>
              <option value="module_start">Module Starts</option>
              <option value="module_complete">Module Completions</option>
              <option value="session_start">Session Starts</option>
              <option value="session_end">Session Ends</option>
            </select>
          </div>

          <div className="form-group">
            <label>Limit:</label>
            <input
              type="number"
              value={exportParams.limit}
              onChange={(e) => setExportParams({...exportParams, limit: parseInt(e.target.value)})}
              min="1"
              max="100000"
            />
          </div>

          <button 
            onClick={handleExport} 
            disabled={exporting}
            className="export-button"
          >
            {exporting ? 'Exporting...' : 'Export JSON'}
          </button>
        </div>
      </div>

      <div className="info-section">
        <h3>About Training Data Collection</h3>
        <ul>
          <li><strong>Anonymization:</strong> All user IDs are hashed using SHA-256</li>
          <li><strong>Purpose:</strong> Data used for AI model retraining and improvement</li>
          <li><strong>Privacy:</strong> No personally identifiable information is stored</li>
          <li><strong>Data Types:</strong> Quiz answers, clicks, page views, time spent, module interactions</li>
          <li><strong>ML Applications:</strong> IRT parameter tuning, difficulty estimation, adaptive learning</li>
        </ul>
      </div>

      <style jsx>{`
        .training-data-dashboard {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .subtitle {
          color: #666;
          font-size: 0.9rem;
          margin-top: -0.5rem;
        }

        .stats-section {
          margin: 2rem 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin: 1rem 0;
        }

        .stat-card {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #e0e0e0;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          color: #666;
          font-size: 0.9rem;
        }

        .interaction-types {
          margin: 2rem 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }

        th, td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }

        th {
          background: #f8f9fa;
          font-weight: 600;
        }

        tr:hover {
          background: #f8f9fa;
        }

        .export-section {
          margin: 2rem 0;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .info {
          color: #666;
          margin: 1rem 0;
        }

        .export-form {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin: 1rem 0;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: #333;
        }

        .form-group input,
        .form-group select {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        .export-button {
          padding: 0.75rem 1.5rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 1.5rem;
        }

        .export-button:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .export-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .info-section {
          margin: 2rem 0;
          padding: 1.5rem;
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          border-radius: 4px;
        }

        .info-section ul {
          margin-top: 1rem;
        }

        .info-section li {
          margin: 0.5rem 0;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}

export default TrainingDataDashboard;
