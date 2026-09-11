import React, { useState, useEffect } from 'react';
import { getNotificationPreferences, updateNotificationPreferences } from '../../api';

/**
 * NotificationSettings Component
 * FR15/UC16: choose email and in-app notifications
 */
const NotificationSettings = ({ token }) => {
  const [prefs, setPrefs] = useState({ emailEnabled: true, pushEnabled: false, inAppEnabled: true });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!token) return;
    getNotificationPreferences(token)
      .then(setPrefs)
      .catch((error) => console.error('Failed to load notification preferences:', error))
      .finally(() => setLoading(false));
  }, [token]);

  const handleToggle = async (key) => {
    const previous = prefs;
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);

    try {
      const result = await updateNotificationPreferences(token, { [key]: updated[key] });
      setPrefs(result.preferences);
      setMessage({ type: 'success', text: 'Preferences updated successfully!' });
    } catch {
      setPrefs(previous);
      setMessage({ type: 'error', text: 'Failed to update preferences.' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) return <div>Loading settings...</div>;

  const options = [
    { key: 'emailEnabled', label: 'Email Notifications', description: 'Receive alerts and reminders by email (requires an email address on your account).' },
    { key: 'inAppEnabled', label: 'In-App Notifications', description: 'Show alerts in the notification bell.' }
  ];

  return (
    <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#667eea' }}>Notification Settings</h2>
      <p style={{ color: '#666', fontSize: '14px' }}>Choose how you want to be notified about your progress.</p>

      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '15px',
          borderRadius: '4px',
          backgroundColor: message.type === 'success' ? '#e8f5e9' : '#ffebee',
          color: message.type === 'success' ? '#2e7d32' : '#c62828'
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {options.map(({ key, label, description }) => (
          <label key={key} style={styles.settingItem}>
            <div>
              <div style={styles.label}>{label}</div>
              <div style={styles.description}>{description}</div>
            </div>
            <input type="checkbox" checked={Boolean(prefs[key])} onChange={() => handleToggle(key)} style={styles.checkbox} />
          </label>
        ))}

        <div style={{ ...styles.settingItem, opacity: 0.6 }}>
          <div>
            <div style={styles.label}>Push Notifications</div>
            <div style={styles.description}>Not available yet - requires the planned mobile app.</div>
          </div>
          <input type="checkbox" checked={false} disabled style={styles.checkbox} />
        </div>
      </div>
    </div>
  );
};

const styles = {
  settingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #eee',
    cursor: 'pointer'
  },
  label: { fontWeight: 'bold', color: '#333' },
  description: { fontSize: '12px', color: '#999' },
  checkbox: { width: '20px', height: '20px', cursor: 'pointer' }
};

export default NotificationSettings;
