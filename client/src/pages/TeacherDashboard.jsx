import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, TrendingUp, Award, BookOpen, LogOut, User, Shield, RefreshCw, Download,
  FileText, AlertTriangle, CalendarDays, CheckCircle, XCircle
} from 'lucide-react';
import { apiFetch, getClassReport, downloadClassReportPDF, getPendingReviews, reviewResponse } from '../api';

const today = () => new Date().toISOString().split('T')[0];

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function TeacherDashboard({ token, user, onLogout }) {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [report, setReport] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewFeedback, setReviewFeedback] = useState({});

  useEffect(() => {
    loadAllData().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAllData() {
    await Promise.all([loadStudents(), loadAnalytics(), loadReviews()]);
  }

  async function refreshData() {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }

  async function loadStudents() {
    try {
      const res = await apiFetch('/api/teacher/students', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load students:', e);
    }
  }

  async function loadAnalytics() {
    try {
      setReport(await getClassReport(token));
      setAnalyticsError(null);
    } catch (err) {
      console.error('Class report error:', err);
      setAnalyticsError(err.response?.data?.error || 'Class analytics could not be loaded');
    }
  }

  async function loadReviews() {
    try {
      const data = await getPendingReviews(token);
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Failed to load pending reviews:', err);
    }
  }

  async function exportCSV() {
    try {
      const response = await apiFetch('/api/reports/class/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentIds: students.map((s) => s._id) })
      });
      if (!response.ok) throw new Error('Export failed');
      saveBlob(await response.blob(), `class-report-${today()}.csv`);
    } catch (error) {
      console.error('CSV export error:', error);
      alert('Failed to export CSV report');
    }
  }

  async function exportPDF() {
    try {
      saveBlob(await downloadClassReportPDF(token), `class-report-${today()}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF report');
    }
  }

  async function submitReview(reviewId, correct) {
    setReviewingId(reviewId);
    try {
      await reviewResponse(token, reviewId, { correct, feedback: reviewFeedback[reviewId] || '' });
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      loadAnalytics();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save review');
    } finally {
      setReviewingId(null);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-main">
          <div className="teacher-loading-container">
            <div className="teacher-loading-text">Loading teacher dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  const totalStudents = students.length;
  const avgTheta = totalStudents ? students.reduce((sum, s) => sum + (s.theta || 0), 0) / totalStudents : 0;
  const totalQuestions = students.reduce((sum, s) => sum + (s.stats?.totalQuestions || 0), 0);
  const summary = report?.summary;
  const riskById = new Map((report?.students || []).map((s) => [s.id, s]));
  const atRiskStudents = (report?.students || []).filter((s) => s.atRisk);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div>
            <h1>Teacher Dashboard</h1>
            <p className="header-subtitle">Monitor student progress and performance</p>
          </div>
          <div className="teacher-header-actions">
            <button className="logout-btn teacher-btn-refresh" onClick={refreshData} disabled={refreshing} title="Refresh all data">
              <RefreshCw size={20} className={refreshing ? 'spinning' : ''} />
              Refresh
            </button>
            <button className="logout-btn teacher-btn-export" onClick={exportCSV} title="Download CSV report (FR13)">
              <Download size={20} />
              CSV
            </button>
            <button className="logout-btn teacher-btn-export" onClick={exportPDF} title="Download PDF report (FR13)">
              <FileText size={20} />
              PDF
            </button>
            <button className="logout-btn teacher-btn-dashboard" onClick={() => navigate('/calendar')}>
              <CalendarDays size={20} />
              Calendar
            </button>
            {user?.role === 'admin' && (
              <button className="logout-btn teacher-btn-admin" onClick={() => navigate('/admin')}>
                <Shield size={20} />
                Admin
              </button>
            )}
            <button className="logout-btn teacher-btn-account" onClick={() => navigate('/account')}>
              <User size={20} />
              Account
            </button>
            <button className="logout-btn" onClick={onLogout}>
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="teacher-dashboard-content">
        <h2 className="teacher-header-title">
          <Users size={36} color="#667eea" />
          Student Overview
        </h2>
        <p className="teacher-header-subtitle">Class performance metrics and individual progress tracking</p>

        <div className="teacher-stats-grid">
          <div className="teacher-stat-card teacher-stat-card-purple">
            <div className="teacher-stat-header">
              <Users size={24} />
              <span className="teacher-stat-label">Total Students</span>
            </div>
            <div className="teacher-stat-value">{totalStudents}</div>
          </div>

          <div className="teacher-stat-card teacher-stat-card-blue">
            <div className="teacher-stat-header">
              <TrendingUp size={24} />
              <span className="teacher-stat-label">Avg Ability (θ)</span>
            </div>
            <div className="teacher-stat-value">{avgTheta.toFixed(2)}</div>
          </div>

          <div className="teacher-stat-card teacher-stat-card-pink">
            <div className="teacher-stat-header">
              <BookOpen size={24} />
              <span className="teacher-stat-label">Total Answers</span>
            </div>
            <div className="teacher-stat-value">{totalQuestions}</div>
          </div>

          {summary && (
            <div className="teacher-stat-card teacher-stat-card-green">
              <div className="teacher-stat-header">
                <Award size={24} />
                <span className="teacher-stat-label">Avg Accuracy</span>
              </div>
              <div className="teacher-stat-value">{summary.averageAccuracy}%</div>
            </div>
          )}

          {summary && (
            <div className="teacher-stat-card teacher-stat-card-pink">
              <div className="teacher-stat-header">
                <AlertTriangle size={24} />
                <span className="teacher-stat-label">At Risk</span>
              </div>
              <div className="teacher-stat-value">{summary.atRiskCount}</div>
            </div>
          )}
        </div>

        {/* Free-text answers the automatic grader was not confident about */}
        <div className="teacher-students-table">
          <h3 className="teacher-table-title">Answers Waiting for Review ({reviews.length})</h3>
          {reviews.length === 0 ? (
            <div className="teacher-empty-state">No answers need review right now.</div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} style={{ borderBottom: '1px solid #eee', padding: '16px 0' }}>
                <div style={{ fontWeight: 600 }}>
                  {review.student?.username || 'Unknown student'}
                  {review.question?.skill && <span style={{ color: '#888', fontWeight: 400 }}> · {review.question.skill}</span>}
                </div>
                <p style={{ margin: '6px 0' }}><strong>Question:</strong> {review.question?.text}</p>
                <p style={{ margin: '6px 0' }}><strong>Expected:</strong> {review.question?.answer}</p>
                <p style={{ margin: '6px 0' }}><strong>Student answer:</strong> {review.userAnswer}</p>
                {review.provisionalGrade != null && (
                  <p style={{ margin: '6px 0', color: '#666' }}>Automatic score: {review.provisionalGrade}%</p>
                )}
                <input
                  type="text"
                  placeholder="Feedback for the student (optional)"
                  value={reviewFeedback[review.id] || ''}
                  onChange={(e) => setReviewFeedback((prev) => ({ ...prev, [review.id]: e.target.value }))}
                  style={{ width: '100%', padding: '8px', margin: '8px 0', borderRadius: '6px', border: '1px solid #ddd' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="logout-btn"
                    style={{ background: '#2e7d32' }}
                    disabled={reviewingId === review.id}
                    onClick={() => submitReview(review.id, true)}
                  >
                    <CheckCircle size={18} />
                    Correct
                  </button>
                  <button
                    className="logout-btn"
                    style={{ background: '#c62828' }}
                    disabled={reviewingId === review.id}
                    onClick={() => submitReview(review.id, false)}
                  >
                    <XCircle size={18} />
                    Incorrect
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="teacher-students-table">
          <h3 className="teacher-table-title">Student Performance Details</h3>

          {students.length === 0 ? (
            <div className="teacher-empty-state">No students found. Students will appear here once they register.</div>
          ) : (
            <div className="teacher-table-scroll">
              <table className="teacher-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Name</th>
                    <th className="center">Ability (θ)</th>
                    <th className="center">Answers</th>
                    <th className="center">Accuracy</th>
                    <th className="center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const accuracy = student.stats?.accuracy || 0;
                    const risk = riskById.get(student._id);
                    const isAtRisk = risk ? risk.atRisk : accuracy < 50 || (student.theta || 0) < -1;

                    return (
                      <tr key={student._id}>
                        <td className="bold">{student.username}</td>
                        <td>{student.firstName || student.lastName ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : '-'}</td>
                        <td className="center">
                          <span className="teacher-theta-badge">{(student.theta || 0).toFixed(2)}</span>
                        </td>
                        <td className="center bold">{student.stats?.totalQuestions || 0}</td>
                        <td className="center">
                          <span className={accuracy >= 70 ? 'teacher-accuracy-high' : accuracy >= 50 ? 'teacher-accuracy-medium' : 'teacher-accuracy-low'}>
                            {accuracy}%
                          </span>
                        </td>
                        <td className="center" title={risk?.riskReasons?.join(', ')}>
                          {isAtRisk
                            ? <span className="teacher-status-risk">⚠️ AT RISK</span>
                            : <span className="teacher-status-good">✓ ON TRACK</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {atRiskStudents.length > 0 && (
          <div className="teacher-analytics-section">
            <h3 className="teacher-analytics-title">⚠️ Students Needing Attention</h3>
            <div className="teacher-table-scroll">
              <table className="teacher-analytics-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Level</th>
                    <th>Accuracy</th>
                    <th>Reasons</th>
                  </tr>
                </thead>
                <tbody>
                  {atRiskStudents.map((student) => (
                    <tr key={student.id}>
                      <td><strong>{student.name}</strong></td>
                      <td>{student.level}</td>
                      <td>
                        <span className={student.accuracy >= 70 ? 'teacher-retention-high' : student.accuracy >= 50 ? 'teacher-retention-medium' : 'teacher-retention-low'}>
                          {student.accuracy}%
                        </span>
                      </td>
                      <td>{student.riskReasons.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {analyticsError && (
          <div className="teacher-analytics-error">
            <span style={{ fontSize: '20px' }}>ℹ️</span>
            <span>{analyticsError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
