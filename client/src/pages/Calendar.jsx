import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import '../styles.css';

export default function Calendar({ token: tokenProp }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState('month'); // month or list
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [students, setStudents] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    module: '',
    students: [],
    dueDate: '',
    startDate: new Date().toISOString().slice(0, 16),
    points: 100
  });

  const token = tokenProp || localStorage.getItem('token');

  useEffect(() => {
    fetchUserRole();
    fetchCalendarEvents();
  }, [currentDate]);

  const fetchUserRole = async () => {
    try {
      const res = await apiFetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUserRole(data.role);
      
      if (['teacher', 'admin'].includes(data.role)) {
        fetchStudents();
        fetchModules();
      }
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await apiFetch('/api/teacher/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const fetchModules = async () => {
    try {
      const res = await apiFetch('/api/modules', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setModules(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    }
  };

  const fetchCalendarEvents = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const res = await apiFetch(
        `/api/calendar?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    
    try {
      const res = await apiFetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          students: formData.students.map(s => s.value || s)
        })
      });

      if (res.ok) {
        const assignment = await res.json();
        
        // Publish immediately
        await apiFetch(`/api/assignments/${assignment._id}/publish`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        setShowCreateModal(false);
        setFormData({
          title: '',
          description: '',
          module: '',
          students: [],
          dueDate: '',
          startDate: new Date().toISOString().slice(0, 16),
          points: 100
        });
        fetchCalendarEvents();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to create assignment');
      }
    } catch (error) {
      console.error('Failed to create assignment:', error);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startPadding = firstDay.getDay();
    
    // Previous month padding
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: '#27ae60',
      published: '#3498db',
      draft: '#95a5a6',
      archived: '#7f8c8d',
      overdue: '#e74c3c'
    };
    return colors[status] || '#3498db';
  };

  const isOverdue = (dueDate, status) => {
    if (status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  const days = getDaysInMonth();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h1>📅 Calendar</h1>
        <div className="calendar-controls">
          <div className="view-toggle">
            <button
              onClick={() => setView('month')}
              className={`view-btn ${view === 'month' ? 'active' : ''}`}
            >
              Month View
            </button>
            <button
              onClick={() => setView('list')}
              className={`view-btn ${view === 'list' ? 'active' : ''}`}
            >
              List View
            </button>
          </div>
          
          {['teacher', 'admin'].includes(userRole) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="create-assignment-btn"
            >
              + Create Assignment
            </button>
          )}
        </div>
      </div>

      {view === 'month' ? (
        <>
          {/* Month Navigation */}
          <div className="month-navigation">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="month-nav-btn"
            >
              ← Previous
            </button>
            <h2>{monthName}</h2>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="month-nav-btn"
            >
              Next →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="calendar-day-header">
                {day}
              </div>
            ))}
            
            {days.map((date, idx) => {
              const dayEvents = date ? getEventsForDate(date) : [];
              const isToday = date && date.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={idx}
                  className={`calendar-day ${!date ? 'empty' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => date && setSelectedDate(date)}
                >
                  {date && (
                    <>
                      <div className={`day-number ${isToday ? 'today' : ''}`}>
                        {date.getDate()}
                      </div>
                      <div className="day-events">
                        {dayEvents.slice(0, 3).map((event, i) => {
                          const status = isOverdue(event.date, event.status) ? 'overdue' : event.status;
                          return (
                            <div
                              key={i}
                              className={`event-badge event-${status}`}
                            >
                              {event.title}
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="more-events">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* List View */
        <div className="list-view">
          <h2>Upcoming Assignments</h2>
          {loading ? (
            <p>Loading...</p>
          ) : upcomingEvents.length === 0 ? (
            <p className="no-assignments">No upcoming assignments</p>
          ) : (
            <div className="assignments-list">
              {upcomingEvents.map(event => {
                const status = isOverdue(event.date, event.status) ? 'overdue' : event.status;
                return (
                  <div
                    key={event.id}
                    className={`assignment-card assignment-${status}`}
                  >
                    <div className="assignment-content">
                      <div className="assignment-info">
                        <h3 className="assignment-title">{event.title}</h3>
                        <p className="assignment-description">{event.description}</p>
                        <div className="assignment-meta">
                          <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                          <span>⏰ {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>🎯 {event.points} points</span>
                        </div>
                      </div>
                      <div className={`assignment-status status-${status}`}>
                        {status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected Date Modal */}
      {selectedDate && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
            
            {getEventsForDate(selectedDate).length === 0 ? (
              <p className="no-assignments">No assignments for this day</p>
            ) : (
              <div className="modal-events">
                {getEventsForDate(selectedDate).map((event, i) => {
                  const status = isOverdue(event.date, event.status) ? 'overdue' : event.status;
                  return (
                    <div
                      key={i}
                      className={`modal-event modal-event-${status}`}
                    >
                      <h4 className="modal-event-title">{event.title}</h4>
                      <p className="modal-event-description">{event.description}</p>
                      <div className="modal-event-meta">
                        <span>🎯 {event.points} points</span>
                        <span className={`modal-event-status status-${status}`}>
                          {status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <button
              onClick={() => setSelectedDate(null)}
              className="modal-close-btn"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="modal-content modal-large"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Create Assignment</h2>
            <form onSubmit={handleCreateAssignment} className="assignment-form">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Module *</label>
                <select
                  value={formData.module}
                  onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                  required
                  className="form-input"
                >
                  <option value="">Select a module</option>
                  {modules.map(m => (
                    <option key={m._id} value={m._id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Students *</label>
                <select
                  multiple
                  value={formData.students}
                  onChange={(e) => setFormData({ ...formData, students: Array.from(e.target.selectedOptions, opt => opt.value) })}
                  required
                  className="form-input form-select-multiple"
                >
                  {students.map(s => (
                    <option key={s._id} value={s._id}>{s.username} ({s.email})</option>
                  ))}
                </select>
                <small className="form-hint">Hold Ctrl/Cmd to select multiple students</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Due Date *</label>
                  <input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Points</label>
                <input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                  min={0}
                  className="form-input"
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="form-submit-btn"
                >
                  Create & Publish
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="form-cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
