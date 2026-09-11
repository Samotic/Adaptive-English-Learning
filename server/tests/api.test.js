/**
 * API integration tests. They need a MongoDB server (MONGODB_URI_TEST, default mongodb://127.0.0.1:27017)
 * and use a throwaway database that is dropped at the end. They are skipped when MongoDB is unreachable.
 */
import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-0123456789-abcdefghijklmnopqrstuvwxyz';
process.env.GOOGLE_CLIENT_ID = '';
process.env.GEMINI_API_KEY = '';
process.env.SMTP_HOST = '';

const MONGO_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017';
const DB_NAME = `english_test_${process.pid}`;

const { default: mongoose } = await import('mongoose');
let mongoAvailable = true;
try {
  await mongoose.connect(MONGO_URI, { dbName: DB_NAME, serverSelectionTimeoutMS: 2000 });
} catch {
  mongoAvailable = false;
}

const { default: request } = await import('supertest');
const { createApp } = await import('../src/app.js');
const { default: UserModel } = await import('../src/models/user.js');
const { default: QuestionModel } = await import('../src/models/question.js');
const { default: ModuleModel } = await import('../src/models/module.js');

describe('API', { skip: mongoAvailable ? false : 'MongoDB is not reachable' }, () => {
  let app;
  let counter = 0;

  const auth = (token) => ({ Authorization: `Bearer ${token}` });

  async function registerUser(role = 'student') {
    counter += 1;
    const username = `${role}_${counter}_${Date.now().toString(36)}`;
    const res = await request(app).post('/api/register').send({ username, password: 'password123' });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    if (role !== 'student') await UserModel.updateOne({ _id: res.body.user.id }, { role });
    return { token: res.body.token, id: res.body.user.id, username };
  }

  before(async () => {
    app = createApp();
    await mongoose.connection.syncIndexes();
  });

  after(async () => {
    if (mongoose.connection.readyState === 1 && mongoose.connection.name.startsWith('english_test_')) {
      await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
  });

  test('health check and unknown API routes', async () => {
    const health = await request(app).get('/health');
    assert.equal(health.status, 200);
    assert.equal(health.body.database, 'healthy');

    const missing = await request(app).get('/api/does-not-exist');
    assert.equal(missing.status, 404);
    assert.ok(missing.body.error);
  });

  test('registration validates input and rejects duplicates', async () => {
    assert.equal((await request(app).post('/api/register').send({ username: 'ab', password: 'password123' })).status, 400);
    assert.equal((await request(app).post('/api/register').send({ username: 'valid_name', password: 'short' })).status, 400);
    assert.equal((await request(app).post('/api/register').send({})).status, 400);

    const first = await request(app).post('/api/register').send({ username: 'dupe_user', password: 'password123' });
    assert.equal(first.status, 201);
    assert.ok(first.body.token);
    assert.equal(first.body.user.theta, 0);
    assert.equal(first.body.user.password, undefined);

    const second = await request(app).post('/api/register').send({ username: 'dupe_user', password: 'password123' });
    assert.equal(second.status, 409);
  });

  test('login succeeds only with the right password', async () => {
    const { username } = await registerUser();
    assert.equal((await request(app).post('/api/login').send({ username, password: 'wrong-password' })).status, 401);
    const ok = await request(app).post('/api/login').send({ username, password: 'password123' });
    assert.equal(ok.status, 200);
    assert.ok(ok.body.token);
  });

  test('protected routes reject missing and forged tokens', async () => {
    assert.equal((await request(app).get('/api/profile')).status, 401);
    assert.equal((await request(app).get('/api/profile').set(auth('not-a-real-token'))).status, 401);
  });

  test('Google sign-in is refused when not configured (no mock logins)', async () => {
    const res = await request(app).post('/api/auth/google').send({ credential: 'demo-google-token-1234567890' });
    assert.equal(res.status, 503);
  });

  test('answers are graded on the server and theta is persisted', async () => {
    const student = await registerUser();
    const question = await QuestionModel.create({
      text: "Choose: 'She ___ to the store yesterday.'",
      answer: 'went',
      options: ['go', 'goes', 'went', 'going'],
      skill: 'writing',
      type: 'multiple-choice',
      difficulty: 0
    });

    // A client claiming "correct: true" for a wrong answer must not be trusted
    const wrong = await request(app).post('/api/submit').set(auth(student.token))
      .send({ questionId: question._id, userAnswer: 'goes', correct: true });
    assert.equal(wrong.status, 200);
    assert.equal(wrong.body.correct, false);
    assert.equal(wrong.body.correctAnswer, 'went');

    const right = await request(app).post('/api/submit').set(auth(student.token))
      .send({ questionId: question._id, userAnswer: 'Went' });
    assert.equal(right.body.correct, true);

    const profile = await request(app).get('/api/profile').set(auth(student.token));
    assert.equal(profile.status, 200);
    assert.equal(profile.body.theta, right.body.newTheta);
    assert.notEqual(profile.body.theta, 0);

    const missing = await request(app).post('/api/submit').set(auth(student.token))
      .send({ questionId: new mongoose.Types.ObjectId(), userAnswer: 'x' });
    assert.equal(missing.status, 404);
  });

  test('module content does not leak answer keys', async () => {
    const student = await registerUser();
    const question = await QuestionModel.create({ text: 'Opposite of hot?', answer: 'cold', skill: 'reading', type: 'free-text' });
    const module = await ModuleModel.create({ title: 'Test module', skill: 'reading', level: 2, items: [{ title: 'Q1', questionId: question._id }] });

    const res = await request(app).get(`/api/module/${module._id}`).set(auth(student.token));
    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 1);
    assert.equal(res.body.items[0].question.text, 'Opposite of hot?');
    assert.equal(res.body.items[0].question.answer, undefined);

    const next = await request(app).get('/api/next-question').set(auth(student.token));
    assert.equal(next.status, 200);
    assert.equal(next.body.answer, undefined);
  });

  test('low-confidence free-text answers go to teacher review', async () => {
    const student = await registerUser();
    const teacher = await registerUser('teacher');
    const question = await QuestionModel.create({
      text: 'What does "resilience" mean?',
      answer: 'the ability to recover or bounce back from difficulties',
      skill: 'reading',
      type: 'free-text',
      difficulty: 1
    });

    const submitted = await request(app).post('/api/submit').set(auth(student.token))
      .send({ questionId: question._id, userAnswer: 'ability to recover', isNLP: true });
    assert.equal(submitted.body.reviewStatus, 'pending_review');
    assert.equal(submitted.body.newTheta, 0, 'pending answers must not move theta');

    assert.equal((await request(app).get('/api/reviews/pending').set(auth(student.token))).status, 403);
    const pending = await request(app).get('/api/reviews/pending').set(auth(teacher.token));
    const review = pending.body.reviews.find((r) => r.id === submitted.body.responseId);
    assert.ok(review);

    const reviewed = await request(app).post(`/api/reviews/${review.id}`).set(auth(teacher.token)).send({ correct: true, feedback: 'Good enough' });
    assert.equal(reviewed.status, 200);
    assert.equal((await request(app).post(`/api/reviews/${review.id}`).set(auth(teacher.token)).send({ correct: true })).status, 409);

    const profile = await request(app).get('/api/profile').set(auth(student.token));
    assert.ok(profile.body.theta > 0);

    const unread = await request(app).get('/api/notifications/unread').set(auth(student.token));
    assert.ok(unread.body.notifications.some((n) => n.type === 'review'));
  });

  test('offline progress sync records answers', async () => {
    const student = await registerUser();
    const question = await QuestionModel.create({ text: 'Plural of child?', answer: 'children', skill: 'reading', type: 'multiple-choice' });
    const res = await request(app).post('/api/progress/sync').set(auth(student.token)).send({
      entries: [
        { questionId: question._id, userAnswer: 'children', answeredAt: new Date(Date.now() - 60000) },
        { questionId: 'not-an-id', userAnswer: 'x' }
      ]
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.synced, 1);
    assert.equal(res.body.results[1].success, false);
  });

  test('notification routes are not shadowed and preferences persist', async () => {
    const student = await registerUser();
    const prefs = await request(app).get('/api/notifications/preferences').set(auth(student.token));
    assert.equal(prefs.status, 200);
    assert.equal(prefs.body.emailEnabled, true);

    const saved = await request(app).put('/api/notifications/preferences').set(auth(student.token)).send({ emailEnabled: false });
    assert.equal(saved.body.preferences.emailEnabled, false);
    const reloaded = await request(app).get('/api/notifications/preferences').set(auth(student.token));
    assert.equal(reloaded.body.emailEnabled, false);

    const unread = await request(app).get('/api/notifications/unread').set(auth(student.token));
    assert.equal(unread.status, 200);
    assert.equal(typeof unread.body.count, 'number');
  });

  test('role-based access control', async () => {
    const student = await registerUser();
    const other = await registerUser();
    const admin = await registerUser('admin');

    assert.equal((await request(app).get('/api/admin/users').set(auth(student.token))).status, 403);
    assert.equal((await request(app).post('/api/module').set(auth(student.token)).send({ title: 'Hack' })).status, 403);
    assert.equal((await request(app).get(`/api/analytics/user/${other.id}`).set(auth(student.token))).status, 403);
    assert.equal((await request(app).get(`/api/analytics/user/${student.id}`).set(auth(student.token))).status, 200);
    assert.equal((await request(app).get('/api/mlops/status').set(auth(student.token))).status, 403);
    assert.equal((await request(app).get('/api/audit-logs').set(auth(student.token))).status, 403);

    assert.equal((await request(app).get('/api/admin/users').set(auth(admin.token))).status, 200);
    const selfDemote = await request(app).put(`/api/admin/users/${admin.id}/role`).set(auth(admin.token)).send({ role: 'student' });
    assert.ok([200, 409].includes(selfDemote.status));
  });

  test('withdrawn consent is honoured', async () => {
    const student = await registerUser();

    const initial = await request(app).get('/api/gdpr/consent').set(auth(student.token));
    assert.equal(initial.body.analyticsConsent, false, 'analytics must be opt-in');

    const skipped = await request(app).post('/api/training-data/click').set(auth(student.token)).send({ elementClicked: 'x', pageUrl: '/' });
    assert.equal(skipped.body.skipped, true);

    await request(app).put('/api/gdpr/consent').set(auth(student.token)).send({ analytics: true, dataProcessing: false });
    const updated = await request(app).get('/api/gdpr/consent').set(auth(student.token));
    assert.equal(updated.body.analyticsConsent, true);
    assert.equal(updated.body.dataProcessingConsent, false);

    await request(app).put('/api/gdpr/consent').set(auth(student.token)).send({ dataProcessing: true });
    const recorded = await request(app).post('/api/training-data/click').set(auth(student.token)).send({ elementClicked: 'x', pageUrl: '/' });
    assert.equal(recorded.body.success, true);
    assert.ok(recorded.body.id);
  });

  test('assignments appear on the student calendar with a date', async () => {
    const teacher = await registerUser('teacher');
    const student = await registerUser();
    const due = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const created = await request(app).post('/api/assignments').set(auth(teacher.token))
      .send({ title: 'Essay', students: [student.id], dueDate: due.toISOString(), module: '' });
    assert.equal(created.status, 201, JSON.stringify(created.body));

    const invalid = await request(app).post('/api/assignments').set(auth(teacher.token)).send({ title: 'No date' });
    assert.equal(invalid.status, 400);

    assert.equal((await request(app).post(`/api/assignments/${created.body._id}/publish`).set(auth(teacher.token))).status, 200);

    const calendar = await request(app).get('/api/calendar').set(auth(student.token));
    assert.equal(calendar.status, 200);
    assert.equal(calendar.body.length, 1);
    assert.equal(new Date(calendar.body[0].date).getTime(), due.getTime());

    const unread = await request(app).get('/api/notifications/unread').set(auth(student.token));
    assert.ok(unread.body.notifications.some((n) => n.type === 'assignment'));
  });

  test('support tickets persist and can be resolved by their owner', async () => {
    const student = await registerUser();
    const created = await request(app).post('/api/support/tickets').set(auth(student.token))
      .send({ subject: 'Audio', message: 'The audio does not play', priority: 'high' });
    assert.equal(created.status, 201);

    const list = await request(app).get('/api/support/tickets').set(auth(student.token));
    assert.equal(list.body.tickets.length, 1);

    const resolved = await request(app).patch(`/api/support/tickets/${created.body.ticket.id}`).set(auth(student.token)).send({ status: 'resolved' });
    assert.equal(resolved.body.ticket.status, 'resolved');

    const other = await registerUser();
    assert.equal((await request(app).patch(`/api/support/tickets/${created.body.ticket.id}`).set(auth(other.token)).send({ status: 'closed' })).status, 403);
  });

  test('teacher class report and PDF export', async () => {
    const teacher = await registerUser('teacher');
    const report = await request(app).get('/api/reports/class').set(auth(teacher.token));
    assert.equal(report.status, 200);
    assert.ok(report.body.summary.totalStudents >= 1);

    const pdf = await request(app).get('/api/reports/class/pdf').set(auth(teacher.token)).buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });
    assert.equal(pdf.status, 200);
    assert.match(pdf.headers['content-type'], /application\/pdf/);
    assert.equal(pdf.body.subarray(0, 4).toString(), '%PDF');
  });

  test('account deletion requires the password and removes the account', async () => {
    const student = await registerUser();
    assert.equal((await request(app).delete('/api/gdpr/delete-account').set(auth(student.token)).send({ password: 'nope' })).status, 401);

    const deleted = await request(app).delete('/api/gdpr/delete-account').set(auth(student.token)).send({ password: 'password123' });
    assert.equal(deleted.status, 200);
    assert.equal((await request(app).get('/api/profile').set(auth(student.token))).status, 401);
    assert.equal((await request(app).post('/api/login').send({ username: student.username, password: 'password123' })).status, 401);
  });
});
