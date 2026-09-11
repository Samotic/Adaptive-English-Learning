import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';

export default function Privacy({ token }) {
  const [consent, setConsent] = useState({
    dataProcessing: true,
    marketing: false,
    analytics: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadConsent();
  }, []);

  async function loadConsent() {
    try {
      const res = await apiFetch('/api/gdpr/consent', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      setConsent({
        dataProcessing: data.dataProcessingConsent,
        marketing: data.marketingConsent,
        analytics: data.analyticsConsent
      });
    } catch (e) {
      console.error('Failed to load consent:', e);
    } finally {
      setLoading(false);
    }
  }

  async function saveConsent() {
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const res = await apiFetch('/api/gdpr/consent', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(consent)
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: '✅ Privacy preferences saved successfully' });
      } else {
        setMessage({ type: 'error', text: '❌ Failed to save preferences' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: '❌ Error saving preferences' });
    } finally {
      setSaving(false);
    }
  }

  async function exportData() {
    setExportLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const res = await apiFetch('/api/gdpr/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      
      if (res.ok) {
        // Download as JSON file
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        setMessage({ type: 'success', text: '✅ Data exported successfully' });
      } else {
        setMessage({ type: 'error', text: '❌ Failed to export data' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: '❌ Error exporting data' });
    } finally {
      setExportLoading(false);
    }
  }

  async function deleteAccount() {
    if (!deletePassword) {
      setMessage({ type: 'error', text: '❌ Enter your password (accounts created with Google: type DELETE)' });
      return;
    }
    
    const confirmed = window.confirm(
      '⚠️ WARNING: This action is PERMANENT and cannot be undone.\n\n' +
      'All your data will be permanently deleted:\n' +
      '• Account information\n' +
      '• Learning progress\n' +
      '• Quiz responses\n' +
      '• Activity history\n\n' +
      'Are you absolutely sure you want to delete your account?'
    );
    
    if (!confirmed) return;
    
    try {
      const res = await apiFetch('/api/gdpr/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          password: deletePassword,
          confirm: 'DELETE',
          reason: deleteReason || 'User requested deletion'
        })
      });
      
      const result = await res.json();
      
      if (res.ok) {
        alert('✅ Your account has been successfully deleted.\n\nYou will be logged out now.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      } else {
        setMessage({ type: 'error', text: `❌ ${result.error || 'Failed to delete account'}` });
      }
    } catch (e) {
      setMessage({ type: 'error', text: '❌ Error deleting account' });
    }
  }

  if (loading) {
    return <div className="privacy-page"><div className="loading">Loading privacy settings...</div></div>;
  }

  return (
    <div className="privacy-page">
      <div className="privacy-container">
        <h1>🔒 Privacy & Data Control</h1>
        <p className="subtitle">Manage your data and privacy preferences</p>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Consent Preferences */}
        <section className="privacy-section">
          <h2>Data Processing Consent</h2>
          <p className="section-description">
            Control how we use your data to improve your learning experience
          </p>

          <div className="consent-options">
            <div className="consent-item">
              <div className="consent-header">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={consent.dataProcessing}
                    onChange={(e) => setConsent({ ...consent, dataProcessing: e.target.checked })}
                    className="toggle-checkbox"
                  />
                  <span className="toggle-switch"></span>
                  <span className="toggle-text">Essential Data Processing</span>
                </label>
              </div>
              <p className="consent-description">
                Required for platform functionality, adaptive learning, and progress tracking. 
                Cannot be disabled.
              </p>
            </div>

            <div className="consent-item">
              <div className="consent-header">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={consent.analytics}
                    onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                    className="toggle-checkbox"
                  />
                  <span className="toggle-switch"></span>
                  <span className="toggle-text">Analytics & Improvement</span>
                </label>
              </div>
              <p className="consent-description">
                Help us improve the platform by sharing anonymized usage data and learning patterns.
              </p>
            </div>

            <div className="consent-item">
              <div className="consent-header">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={consent.marketing}
                    onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                    className="toggle-checkbox"
                  />
                  <span className="toggle-switch"></span>
                  <span className="toggle-text">Marketing Communications</span>
                </label>
              </div>
              <p className="consent-description">
                Receive updates, tips, and promotional content about new features and courses.
              </p>
            </div>
          </div>

          <button
            onClick={saveConsent}
            disabled={saving}
            className="btn-save-consent"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </section>

        {/* Data Export */}
        <section className="privacy-section">
          <h2>📥 Export Your Data</h2>
          <p className="section-description">
            Download a complete copy of all your data in JSON format (GDPR Right to Data Portability)
          </p>
          <p className="data-info">
            Your export will include: account information, learning progress, quiz responses, 
            activity logs, and performance statistics.
          </p>
          <button
            onClick={exportData}
            disabled={exportLoading}
            className="btn-export"
          >
            {exportLoading ? '⏳ Exporting...' : '📥 Export My Data'}
          </button>
        </section>

        {/* Account Deletion */}
        <section className="privacy-section danger-zone">
          <h2>⚠️ Danger Zone</h2>
          <p className="section-description">
            Permanently delete your account and all associated data (GDPR Right to Erasure)
          </p>

          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="btn-delete-account"
            >
              Delete My Account
            </button>
          ) : (
            <div className="delete-confirmation">
              <h3>⚠️ Confirm Account Deletion</h3>
              <p className="warning-text">
                This action is <strong>PERMANENT</strong> and cannot be undone. 
                All your data will be permanently deleted.
              </p>
              
              <div className="delete-form">
                <div className="form-group">
                  <label>Enter your password to confirm:</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Your password"
                    className="delete-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Reason for leaving (optional):</label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Help us improve by sharing why you're leaving..."
                    rows="3"
                    className="delete-textarea"
                  />
                </div>
                
                <div className="delete-actions">
                  <button
                    onClick={() => {
                      setDeleteConfirm(false);
                      setDeletePassword('');
                      setDeleteReason('');
                    }}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteAccount}
                    className="btn-confirm-delete"
                    disabled={!deletePassword}
                  >
                    Permanently Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <style>{`
        .privacy-page {
          padding: 40px 20px;
          max-width: 900px;
          margin: 0 auto;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .privacy-container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 2px 20px rgba(0,0,0,0.08);
        }

        .privacy-container h1 {
          font-size: 32px;
          margin-bottom: 8px;
          color: #667eea;
        }

        .subtitle {
          color: #666;
          margin-bottom: 32px;
        }

        .message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-weight: 600;
        }

        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .privacy-section {
          margin-bottom: 40px;
          padding-bottom: 40px;
          border-bottom: 2px solid #f0f0f0;
        }

        .privacy-section:last-child {
          border-bottom: none;
        }

        .privacy-section h2 {
          font-size: 24px;
          margin-bottom: 8px;
          color: #333;
        }

        .section-description {
          color: #666;
          margin-bottom: 20px;
        }

        .consent-options {
          margin-bottom: 24px;
        }

        .consent-item {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .consent-header {
          margin-bottom: 8px;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-weight: 600;
          color: #333;
        }

        .toggle-checkbox {
          display: none;
        }

        .toggle-switch {
          position: relative;
          width: 50px;
          height: 26px;
          background: #ccc;
          border-radius: 13px;
          margin-right: 12px;
          transition: background 0.3s;
        }

        .toggle-switch::after {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: left 0.3s;
        }

        .toggle-checkbox:checked + .toggle-switch {
          background: #667eea;
        }

        .toggle-checkbox:checked + .toggle-switch::after {
          left: 27px;
        }

        .consent-description {
          color: #666;
          font-size: 14px;
          margin-left: 62px;
        }

        .btn-save-consent, .btn-export, .btn-delete-account {
          padding: 12px 32px;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 16px;
        }

        .btn-save-consent {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-save-consent:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-save-consent:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-export {
          background: #28a745;
          color: white;
        }

        .btn-export:hover:not(:disabled) {
          background: #218838;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
        }

        .btn-export:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .data-info {
          background: #e7f3ff;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          color: #004085;
          font-size: 14px;
        }

        .danger-zone {
          background: #fff5f5;
          padding: 24px;
          border-radius: 8px;
          border: 2px solid #ff6b6b;
        }

        .btn-delete-account {
          background: #dc3545;
          color: white;
        }

        .btn-delete-account:hover {
          background: #c82333;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
        }

        .delete-confirmation {
          background: white;
          padding: 24px;
          border-radius: 8px;
          margin-top: 16px;
        }

        .delete-confirmation h3 {
          color: #dc3545;
          margin-bottom: 12px;
        }

        .warning-text {
          color: #721c24;
          background: #f8d7da;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .delete-form {
          margin-top: 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }

        .delete-input, .delete-textarea {
          width: 100%;
          padding: 10px;
          border: 2px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .delete-input:focus, .delete-textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        .delete-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .btn-cancel, .btn-confirm-delete {
          padding: 10px 24px;
          border-radius: 6px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-cancel {
          background: #6c757d;
          color: white;
        }

        .btn-cancel:hover {
          background: #5a6268;
        }

        .btn-confirm-delete {
          background: #dc3545;
          color: white;
          flex: 1;
        }

        .btn-confirm-delete:hover:not(:disabled) {
          background: #c82333;
        }

        .btn-confirm-delete:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading {
          text-align: center;
          padding: 60px;
          color: #666;
        }
      `}</style>
    </div>
  );
}
