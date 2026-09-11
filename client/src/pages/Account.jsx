import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import NotificationSettings from '../components/Notifications/NotificationSettings';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Edit2, Save, X, LogOut, BookOpen, Users, Shield } from 'lucide-react';

export default function Account({ token, user, onLogout }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const res = await apiFetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setProfile(data);
      setFormData({
        email: data.email || '',
        firstName: data.firstName || '',
        lastName: data.lastName || ''
      });
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await apiFetch('/api/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setEditing(false);
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to update profile');
      }
    } catch (e) {
      setMessage('Error updating profile');
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setEditing(false);
    setFormData({
      email: profile?.email || '',
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || ''
    });
  }

  if (!profile) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-main">
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div>
            <h1>Account Settings</h1>
            <p className="header-subtitle">Manage your profile and preferences</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              className="logout-btn" 
              onClick={() => navigate('/dashboard')}
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            >
              <BookOpen size={20} />
              Dashboard
            </button>
            {(user?.role === 'teacher' || user?.role === 'admin') && (
              <button 
                className="logout-btn" 
                onClick={() => navigate('/teacher')}
                style={{ background: 'rgba(79, 172, 254, 0.2)' }}
              >
                <Users size={20} />
                Teacher
              </button>
            )}
            {user?.role === 'admin' && (
              <button 
                className="logout-btn" 
                onClick={() => navigate('/admin')}
                style={{ background: 'rgba(240, 147, 251, 0.2)' }}
              >
                <Shield size={20} />
                Admin
              </button>
            )}
            <button
              className="logout-btn"
              onClick={() => navigate('/privacy')}
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            >
              <Shield size={20} />
              Privacy
            </button>
            <button className="logout-btn" onClick={onLogout}>
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(102, 126, 234, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          paddingBottom: '16px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <User size={32} color="#667eea" />
            Account Settings
          </h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              <Edit2 size={16} />
              Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            background: message.includes('success') ? '#d4edda' : '#f8d7da',
            color: message.includes('success') ? '#155724' : '#721c24',
            fontWeight: '600'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gap: '24px' }}>
            {/* Username (read-only) */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#666',
                fontWeight: '600',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Username
              </label>
              <div style={{
                padding: '14px 16px',
                background: '#f5f5f5',
                borderRadius: '10px',
                color: '#666',
                fontWeight: '600'
              }}>
                {profile.username}
              </div>
            </div>

            {/* Role (read-only) */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#666',
                fontWeight: '600',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Role
              </label>
              <div style={{
                padding: '14px 16px',
                background: '#f5f5f5',
                borderRadius: '10px',
                display: 'inline-block'
              }}>
                <span style={{
                  background: profile.role === 'admin' 
                    ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                    : profile.role === 'teacher'
                    ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontWeight: '700',
                  fontSize: '13px',
                  textTransform: 'capitalize'
                }}>
                  {profile.role || 'student'}
                </span>
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#666',
                fontWeight: '600',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <Mail size={14} style={{ display: 'inline', marginRight: '6px' }} />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!editing}
                placeholder="your.email@example.com"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  fontSize: '15px',
                  background: editing ? 'white' : '#f5f5f5',
                  cursor: editing ? 'text' : 'not-allowed'
                }}
              />
            </div>

            {/* First Name */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#666',
                fontWeight: '600',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={!editing}
                placeholder="John"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  fontSize: '15px',
                  background: editing ? 'white' : '#f5f5f5',
                  cursor: editing ? 'text' : 'not-allowed'
                }}
              />
            </div>

            {/* Last Name */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#666',
                fontWeight: '600',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={!editing}
                placeholder="Doe"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  fontSize: '15px',
                  background: editing ? 'white' : '#f5f5f5',
                  cursor: editing ? 'text' : 'not-allowed'
                }}
              />
            </div>

            {/* Learning Stats - Only for Students */}
            {user?.role === 'student' && (
              <div style={{
                marginTop: '16px',
                padding: '20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                color: 'white'
              }}>
                <h3 style={{ fontSize: '18px', marginBottom: '12px', fontWeight: '700' }}>
                  Learning Progress
                </h3>
                <div style={{ fontSize: '32px', fontWeight: '800' }}>
                  θ = {profile.theta?.toFixed(2) || '0.00'}
                </div>
                <p style={{ opacity: 0.9, fontSize: '14px', marginTop: '4px' }}>
                  Your current ability level
                </p>
              </div>
            )}
          </div>

          {editing && (
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '2px solid #f0f0f0'
            }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '14px 28px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                <Save size={18} />
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: '#e0e0e0',
                  color: '#666',
                  border: 'none',
                  padding: '14px 28px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
      <div style={{ marginTop: '24px' }}>
        <NotificationSettings token={token} />
      </div>
      </div>
    </div>
  );
}
