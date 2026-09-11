import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, UserCheck, UserCog, LogOut, BookOpen, User, Activity, Database } from 'lucide-react';

export default function AdminDashboard({ token, user, onLogout }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await apiFetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(userId, newRole) {
    setUpdating(userId);
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        await loadUsers();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-main">
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading users...</div>
        </div>
      </div>
    );
  }

  const roleStats = {
    admin: users.filter(u => u.role === 'admin').length,
    teacher: users.filter(u => u.role === 'teacher').length,
    student: users.filter(u => u.role === 'student' || !u.role).length
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="header-subtitle">Manage users and system settings</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            
            {/* 1. Dashboard Butonu */}
            <button 
              className="logout-btn" 
              onClick={() => navigate('/dashboard')}
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            >
              <BookOpen size={20} />
              Dashboard
            </button>

            {/* 2. Account Butonu */}
            <button 
              className="logout-btn" 
              onClick={() => navigate('/account')}
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            >
              <User size={20} />
              Account
            </button>

            {/* 3. Teacher Butonu (Düzelttim, içinden fazlalıkları attım) */}
            <button 
              className="logout-btn" 
              onClick={() => navigate('/teacher')}
              style={{ background: 'rgba(79, 172, 254, 0.2)' }}
            >
              <Users size={20} />
              Teacher
            </button>

            {/* 4. YENİ SECURITY BUTONU (Diğerleriyle uyumlu) */}
            <button 
              className="logout-btn" 
              onClick={() => navigate('/admin/audit-logs')}
              style={{ background: 'rgba(220, 38, 38, 0.2)', color: '#fee2e2' }} // Hafif kırmızı arka plan
            >
              <Shield size={20} />
              Security Logs
            </button>

            {/* Admin tools */}
            <button className="logout-btn" onClick={() => navigate('/monitoring')} style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
              <Activity size={20} />
              Monitoring
            </button>
            <button className="logout-btn" onClick={() => navigate('/training-data')} style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
              <Database size={20} />
              Training Data
            </button>

            {/* 5. Logout Butonu */}
            <button className="logout-btn" onClick={onLogout}>
              <LogOut size={20} />
              Logout
            </button>

          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>

      {/* Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          padding: '24px',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 15px rgba(240, 147, 251, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Shield size={24} />
            <span style={{ fontSize: '14px', opacity: 0.9 }}>Admins</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: '800' }}>{roleStats.admin}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          padding: '24px',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <UserCheck size={24} />
            <span style={{ fontSize: '14px', opacity: 0.9 }}>Teachers</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: '800' }}>{roleStats.teacher}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '24px',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Users size={24} />
            <span style={{ fontSize: '14px', opacity: 0.9 }}>Students</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: '800' }}>{roleStats.student}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          padding: '24px',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 15px rgba(250, 112, 154, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <UserCog size={24} />
            <span style={{ fontSize: '14px', opacity: 0.9 }}>Total Users</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: '800' }}>{users.length}</div>
        </div>
      </div>

      {/* Users Table */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(102, 126, 234, 0.1)'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#1a1a1a',
          marginBottom: '24px'
        }}>
          User Management
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#667eea', fontWeight: '700', fontSize: '14px', textTransform: 'uppercase' }}>
                  Username
                </th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#667eea', fontWeight: '700', fontSize: '14px', textTransform: 'uppercase' }}>
                  Email
                </th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#667eea', fontWeight: '700', fontSize: '14px', textTransform: 'uppercase' }}>
                  Role
                </th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#667eea', fontWeight: '700', fontSize: '14px', textTransform: 'uppercase' }}>
                  θ
                </th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#667eea', fontWeight: '700', fontSize: '14px', textTransform: 'uppercase' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} style={{
                  borderBottom: '1px solid #f0f0f0',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px', fontWeight: '600', color: '#1a1a1a' }}>
                    {user.username}
                  </td>
                  <td style={{ padding: '16px', color: '#666' }}>
                    {user.email || '-'}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{
                      background: user.role === 'admin' 
                        ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                        : user.role === 'teacher'
                        ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      padding: '6px 16px',
                      borderRadius: '20px',
                      fontWeight: '700',
                      fontSize: '12px',
                      textTransform: 'capitalize',
                      display: 'inline-block'
                    }}>
                      {user.role || 'student'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#333' }}>
                    {user.theta?.toFixed(2) || '0.00'}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <select
                      value={user.role || 'student'}
                      onChange={(e) => updateRole(user._id, e.target.value)}
                      disabled={updating === user._id}
                      style={{
                        padding: '8px 32px 8px 12px',
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: updating === user._id ? 'not-allowed' : 'pointer',
                        background: 'white',
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3e%3cpath fill='%23667eea' d='M6 9L1 4h10z'/%3e%3c/svg%3e")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 10px center',
                        opacity: updating === user._id ? 0.5 : 1
                      }}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}