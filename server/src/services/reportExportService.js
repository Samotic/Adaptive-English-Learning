/**
 * Report Export Service - FR13: Exportable Progress Reports (PDF/CSV)
 * Also provides the class overview used by the teacher dashboard (FR10).
 */
import PDFDocument from 'pdfkit';
import UserModel from '../models/user.js';
import ResponseModel from '../models/response.js';
import { HttpError } from '../middleware/errors.js';

const INACTIVE_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;
const num = (value) => (Number.isFinite(value) ? value : 0);
const pct = (correct, total) => (total > 0 ? Math.round((correct / total) * 1000) / 10 : 0);

/** CSV cell with quoting and protection against spreadsheet formula injection. */
export function csvCell(value) {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const csvRow = (...cells) => `${cells.map(csvCell).join(',')}\n`;

class ReportExportService {
  thetaToLevel(theta) {
    const t = num(theta);
    if (t < -1) return 'Beginner';
    if (t < 0) return 'Elementary';
    if (t < 1) return 'Intermediate';
    if (t < 2) return 'Advanced';
    return 'Expert';
  }

  async generateStudentReport(userId) {
    const user = await UserModel.findById(userId).select('-password -verificationToken').lean();
    if (!user) throw new HttpError(404, 'User not found');

    const responses = await ResponseModel.find({ user: userId })
      .sort({ timestamp: -1 })
      .populate('question', 'text skill')
      .lean();

    const totalQuestions = responses.length;
    const correctAnswers = responses.filter((r) => r.correct).length;

    const skillStats = {};
    for (const r of responses) {
      const skill = r.question?.skill || 'unknown';
      skillStats[skill] ??= { total: 0, correct: 0 };
      skillStats[skill].total++;
      if (r.correct) skillStats[skill].correct++;
    }

    const theta = num(user.theta);
    return {
      student: {
        id: user._id.toString(),
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        username: user.username,
        email: user.email || '',
        theta: theta.toFixed(2),
        level: this.thetaToLevel(theta)
      },
      summary: {
        totalQuestions,
        correctAnswers,
        accuracy: `${pct(correctAnswers, totalQuestions)}%`,
        currentAbility: theta.toFixed(2)
      },
      skillBreakdown: Object.entries(skillStats).map(([skill, s]) => ({
        skill,
        total: s.total,
        correct: s.correct,
        accuracy: `${pct(s.correct, s.total)}%`
      })),
      recentActivity: responses.slice(0, 10).map((r) => {
        const text = r.question?.text || 'N/A';
        return {
          question: text.length > 50 ? `${text.slice(0, 50)}...` : text,
          skill: r.question?.skill || 'unknown',
          correct: r.correct ? 'Yes' : 'No',
          date: new Date(r.timestamp).toLocaleDateString()
        };
      })
    };
  }

  async generateClassReport(studentIds) {
    const reports = await Promise.all(
      studentIds.map((id) => this.generateStudentReport(id).catch(() => null))
    );
    const students = reports.filter(Boolean);
    const average = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

    return {
      class: {
        totalStudents: students.length,
        reportDate: new Date().toISOString(),
        averageAccuracy: `${average(students.map((s) => parseFloat(s.summary.accuracy))).toFixed(2)}%`,
        averageTheta: average(students.map((s) => parseFloat(s.student.theta))).toFixed(2)
      },
      students: students.map((s) => ({
        name: s.student.name,
        username: s.student.username,
        theta: s.student.theta,
        level: s.student.level,
        totalQuestions: s.summary.totalQuestions,
        accuracy: s.summary.accuracy
      }))
    };
  }

  /** All students with performance metrics and rule-based at-risk flags. */
  async generateClassOverview() {
    const [students, stats, pendingReviews] = await Promise.all([
      UserModel.find({ role: 'student' }).select('username firstName lastName theta createdAt lastActiveAt').lean(),
      ResponseModel.aggregate([
        {
          $group: {
            _id: '$user',
            total: { $sum: 1 },
            correct: { $sum: { $cond: ['$correct', 1, 0] } },
            lastActivity: { $max: '$timestamp' }
          }
        }
      ]),
      ResponseModel.countDocuments({ reviewStatus: 'pending_review' })
    ]);

    const statsByUser = new Map(stats.map((s) => [s._id.toString(), s]));
    const now = Date.now();

    const rows = students.map((student) => {
      const s = statsByUser.get(student._id.toString()) || { total: 0, correct: 0, lastActivity: null };
      const theta = num(student.theta);
      const accuracy = pct(s.correct, s.total);
      const lastActivity = s.lastActivity || student.lastActiveAt || null;
      const referenceDate = lastActivity || student.createdAt;

      const riskReasons = [];
      if (s.total >= 5 && accuracy < 50) riskReasons.push('Accuracy below 50%');
      if (theta < -1) riskReasons.push('Low ability estimate');
      if (referenceDate && now - new Date(referenceDate).getTime() > INACTIVE_DAYS * DAY_MS) {
        riskReasons.push(`Inactive for ${INACTIVE_DAYS}+ days`);
      }

      return {
        id: student._id.toString(),
        username: student.username,
        name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.username,
        theta: Math.round(theta * 100) / 100,
        level: this.thetaToLevel(theta),
        totalQuestions: s.total,
        correctAnswers: s.correct,
        accuracy,
        lastActivity,
        atRisk: riskReasons.length > 0,
        riskReasons
      };
    });

    const active = rows.filter((r) => r.totalQuestions > 0);
    const average = (values) => (values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100 : 0);

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        totalStudents: rows.length,
        activeStudents: active.length,
        averageAccuracy: average(active.map((r) => r.accuracy)),
        averageTheta: average(rows.map((r) => r.theta)),
        totalAnswers: rows.reduce((sum, r) => sum + r.totalQuestions, 0),
        atRiskCount: rows.filter((r) => r.atRisk).length,
        pendingReviews
      },
      students: rows.sort((a, b) => Number(b.atRisk) - Number(a.atRisk) || a.username.localeCompare(b.username))
    };
  }

  toCSV(reportData, reportType = 'student') {
    if (reportType === 'student') {
      const { student, summary } = reportData;
      let csv = 'Student Progress Report\n\n';
      csv += csvRow('Name', student.name);
      csv += csvRow('Username', student.username);
      csv += csvRow('Email', student.email);
      csv += csvRow('Ability Score (θ)', student.theta);
      csv += csvRow('Level', student.level);
      csv += '\nSummary\n';
      csv += csvRow('Total Questions', summary.totalQuestions);
      csv += csvRow('Correct Answers', summary.correctAnswers);
      csv += csvRow('Accuracy', summary.accuracy);
      csv += '\nSkill Breakdown\n';
      csv += csvRow('Skill', 'Total', 'Correct', 'Accuracy');
      for (const s of reportData.skillBreakdown) csv += csvRow(s.skill, s.total, s.correct, s.accuracy);
      csv += '\nRecent Activity\n';
      csv += csvRow('Question', 'Skill', 'Correct', 'Date');
      for (const a of reportData.recentActivity) csv += csvRow(a.question, a.skill, a.correct, a.date);
      return csv;
    }

    let csv = 'Class Progress Report\n\n';
    csv += csvRow('Report Date', new Date(reportData.class.reportDate).toLocaleDateString());
    csv += csvRow('Total Students', reportData.class.totalStudents);
    csv += csvRow('Average Accuracy', reportData.class.averageAccuracy);
    csv += csvRow('Average Ability (θ)', reportData.class.averageTheta);
    csv += '\nStudent Details\n';
    csv += csvRow('Name', 'Username', 'Ability (θ)', 'Level', 'Total Questions', 'Accuracy');
    for (const s of reportData.students) {
      csv += csvRow(s.name, s.username, s.theta, s.level, s.totalQuestions, s.accuracy);
    }
    return csv;
  }

  /** Streams the class overview as a PDF into a writable stream (e.g. an Express response). */
  writeClassPDF(overview, stream) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(stream);

    doc.fontSize(20).text('Class Performance Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#555').text(`Generated: ${new Date(overview.generatedAt).toLocaleString()}`, { align: 'center' });
    doc.fillColor('black').moveDown();

    const s = overview.summary;
    doc.fontSize(12)
      .text(`Students: ${s.totalStudents} (${s.activeStudents} active)`)
      .text(`Average accuracy: ${s.averageAccuracy}%`)
      .text(`Average ability estimate: ${s.averageTheta}`)
      .text(`Students at risk: ${s.atRiskCount}`)
      .text(`Answers waiting for teacher review: ${s.pendingReviews}`);
    doc.moveDown();

    const columns = [
      { label: 'Student', x: 50, width: 150 },
      { label: 'Level', x: 205, width: 80 },
      { label: 'Ability', x: 290, width: 50 },
      { label: 'Answers', x: 345, width: 55 },
      { label: 'Accuracy', x: 405, width: 60 },
      { label: 'Status', x: 470, width: 80 }
    ];

    const drawHeader = (y) => {
      doc.font('Helvetica-Bold').fontSize(10);
      for (const c of columns) doc.text(c.label, c.x, y, { width: c.width });
      doc.moveTo(50, y + 14).lineTo(545, y + 14).stroke();
      doc.font('Helvetica');
      return y + 22;
    };

    let y = drawHeader(doc.y);
    for (const student of overview.students) {
      if (y > 770) {
        doc.addPage();
        y = drawHeader(50);
      }
      const cells = [student.name, student.level, student.theta.toFixed(2), String(student.totalQuestions), `${student.accuracy}%`];
      cells.forEach((text, i) => doc.fillColor('black').text(text, columns[i].x, y, { width: columns[i].width, ellipsis: true, lineBreak: false }));
      doc.fillColor(student.atRisk ? '#c62828' : '#2e7d32')
        .text(student.atRisk ? 'AT RISK' : 'On track', columns[5].x, y, { width: columns[5].width, lineBreak: false });
      y += 20;
    }
    if (overview.students.length === 0) {
      doc.fillColor('black').text('No students registered yet.', 50, y);
    }

    doc.end();
  }
}

export default new ReportExportService();
