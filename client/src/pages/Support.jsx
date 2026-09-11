import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSupportTicket, getSupportTickets, resolveSupportTicket } from '../api';

/**
 * Support - Destek Sayfası
 * FR23: Student Contact Form
 * 
 * Öğrencilerin hata bildirimi veya yardım talebi gönderebildiği sayfa.
 * Ayrıca geçmiş destek taleplerini listeleyebilirler.
 */
export default function Support({ token }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('new'); // 'new' veya 'history'
  
  // Yeni talep formu state'leri
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  
  // Geçmiş talepler
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Geçmiş talepleri yükle
  const loadTickets = async () => {
    try {
      setLoadingTickets(true);
      const data = await getSupportTickets(token);
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Destek talepleri yüklenemedi:', error);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Tab değiştiğinde geçmiş talepleri yükle
  useEffect(() => {
    if (activeTab === 'history') {
      loadTickets();
    }
  }, [activeTab]);

  // Form gönder
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      setSubmitMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    try {
      setSubmitting(true);
      const result = await createSupportTicket(token, subject, message, priority);
      
      setSubmitMessage({ 
        type: 'success', 
        text: result.message || 'Your request has been submitted successfully!'
      });
      
      // Formu temizle
      setSubject('');
      setMessage('');
      setPriority('normal');
      
      // 5 saniye sonra mesajı temizle
      setTimeout(() => setSubmitMessage(null), 5000);
      
    } catch (error) {
      setSubmitMessage({ 
        type: 'error', 
        text: 'An error occurred while submitting your request. Please try again.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Status renkleri
  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#2196f3';
      case 'in_progress': return '#ff9800';
      case 'resolved': return '#4caf50';
      case 'closed': return '#9e9e9e';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'open': return 'Open';
      case 'in_progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      case 'closed': return 'Closed';
      default: return status;
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'low': return 'Low';
      case 'normal': return 'Normal';
      case 'high': return 'High';
      case 'urgent': return 'Urgent';
      default: return priority;
    }
  };

  return (
    <div className="support-container">
      {/* Header */}
      <div className="support-header">
        <h1 className="support-title">🎫 Help & Support</h1>
        <button 
          onClick={() => navigate('/dashboard')}
          className="support-back-btn"
        >
          ← Go Back
        </button>
      </div>

      {/* Tabs */}
      <div className="support-tabs">
        <div 
          className={`support-tab ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          📝 Create New Request
        </div>
        <div 
          className={`support-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📋 My Past Requests
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'new' ? (
        // Yeni Talep Formu
        <div className="support-card">
          <h2 style={{ marginTop: 0, color: '#333' }}>Create Support Request</h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
            You can submit any issues or help requests through the form below.
          </p>

          {/* Submit Message */}
          {submitMessage && (
            <div className={`support-message ${submitMessage.type}`}>
              {submitMessage.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Konu */}
            <div className="support-form-group">
              <label className="support-label">Subject *</label>
              <input 
                type="text"
                className="support-input"
                placeholder="e.g., Cannot log in"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            {/* Öncelik */}
            <div className="support-form-group">
              <label className="support-label">Priority Level</label>
              <select 
                className="support-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low - General question</option>
                <option value="normal">Normal - Standard support</option>
                <option value="high">High - Important issue</option>
                <option value="urgent">Urgent - Critical error</option>
              </select>
            </div>

            {/* Mesaj */}
            <div className="support-form-group">
              <label className="support-label">Message *</label>
              <textarea 
                className="support-textarea"
                placeholder="Please describe your issue or request in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              className="support-submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : '📤 Submit Request'}
            </button>
          </form>
        </div>
      ) : (
        // Geçmiş Talepler
        <div className="support-card">
          <h2 style={{ marginTop: 0, color: '#333' }}>Your Past Support Requests</h2>
          
          {loadingTickets ? (
            <div className="support-empty-state">
              <div className="support-empty-icon">⏳</div>
              <p>Loading...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="support-empty-state">
              <div className="support-empty-icon">📭</div>
              <p>You haven't created any support requests yet.</p>
            </div>
          ) : (
            <div className="support-ticket-list">
              {tickets.map((ticket) => (
                <div 
                  key={ticket.id}
                  className="support-ticket-card"
                >
                  <div className="support-ticket-header">
                    <div className="support-ticket-subject">#{ticket.id} - {ticket.subject}</div>
                    <div 
                      className="support-status-badge"
                      style={{ background: getStatusColor(ticket.status) }}
                    >
                      {getStatusText(ticket.status)}
                    </div>
                  </div>
                  
                  <p style={{ color: '#666', fontSize: '14px', margin: '8px 0' }}>
                    {ticket.message.length > 150 
                      ? ticket.message.substring(0, 150) + '...' 
                      : ticket.message}
                  </p>

                  {ticket.status === 'open' && (
  <button 
    onClick={async () => {
      await resolveSupportTicket(token, ticket.id);
      loadTickets(); // Listeyi yenile
    }}
    style={{ background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '5px 10px' }}
  >
    Mark as Resolved
  </button>
)}
                  
                  <div className="support-ticket-meta">
                    <span>🏷️ Priority: {getPriorityText(ticket.priority)}</span>
                    <span>📅 {new Date(ticket.createdAt).toLocaleDateString('en-US')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

