import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';

const cell = { padding: '10px', textAlign: 'left' };

export default function AdminAuditLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch('/api/audit-logs')
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'Failed to load audit logs');
        setLogs(Array.isArray(data) ? data : []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const query = filter.toLowerCase();
  const filteredLogs = logs.filter((log) =>
    (log.user || '').toLowerCase().includes(query) || (log.action || '').toLowerCase().includes(query)
  );

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#f4f4f4', minHeight: '100vh' }}>
      <button
        onClick={() => navigate('/dashboard')}
        style={{ marginBottom: '16px', padding: '8px 14px', border: '1px solid #ccc', background: 'white', borderRadius: '4px', cursor: 'pointer' }}
      >
        ← Back to dashboard
      </button>

      <h2 style={{ color: '#d32f2f', borderBottom: '2px solid #d32f2f', paddingBottom: '10px' }}>
        🛡️ SECURITY AUDIT LOGS
      </h2>

      <input
        type="text"
        placeholder="Search user or action..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{ padding: '10px', width: '300px', maxWidth: '100%', marginBottom: '20px', border: '1px solid #ccc' }}
      />

      {error && <div style={{ color: '#c62828', marginBottom: '16px' }}>{error}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <thead style={{ backgroundColor: '#333', color: 'white' }}>
            <tr>
              <th style={cell}>Date</th>
              <th style={cell}>Action</th>
              <th style={cell}>User</th>
              <th style={cell}>IP Address</th>
              <th style={cell}>Status</th>
              <th style={cell}>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} style={cell}>Loading...</td></tr>
            )}
            {!loading && filteredLogs.length === 0 && (
              <tr><td colSpan={6} style={cell}>No audit log entries found.</td></tr>
            )}
            {filteredLogs.map((log) => (
              <tr key={log._id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={cell}>{new Date(log.timestamp).toLocaleString()}</td>
                <td style={{ ...cell, fontWeight: 'bold', color: '#0288d1' }}>{log.action}</td>
                <td style={cell}>{log.user}</td>
                <td style={cell}>{log.ip_address || '-'}</td>
                <td style={cell}>
                  {log.status === 'FAILURE'
                    ? <span style={{ backgroundColor: 'red', color: 'white', padding: '3px 8px', borderRadius: '4px' }}>FAIL</span>
                    : <span style={{ color: 'green' }}>OK</span>}
                </td>
                <td style={{ ...cell, color: '#666' }}>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
