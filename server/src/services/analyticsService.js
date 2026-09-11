import ResponseModel from '../models/response.js';
import UserModel from '../models/user.js';
import QuestionModel from '../models/question.js';

/**
 * Analytics Service
 * Handles user metrics, learning analytics, and reporting
 */

export const getUserMetrics = async (userId) => {
  try {
    const user = await UserModel.findById(userId).lean();
    if (!user) throw new Error('User not found');

    const responses = await ResponseModel.find({ user: userId }).lean();
    const correctAnswers = responses.filter(r => r.correct).length;
    const totalAnswers = responses.length;
    const accuracy = totalAnswers > 0 ? ((correctAnswers / totalAnswers) * 100).toFixed(2) : 0;

    // Get time spent (estimate: 2 min per question)
    const timeSpentMinutes = totalAnswers * 2;

    // Streak calculation
    const sortedResponses = responses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    let streak = 0;
    let prevDate = null;
    for (const resp of sortedResponses) {
      const respDate = new Date(resp.timestamp).toDateString();
      if (!prevDate) {
        if (resp.correct) streak = 1;
      } else if (respDate !== prevDate) {
        if (!resp.correct) break;
        streak++;
      }
      prevDate = respDate;
    }

    return {
      userId,
      username: user.username,
      theta: user.theta || 0,
      totalQuestionsAttempted: totalAnswers,
      correctAnswers,
      accuracy: parseFloat(accuracy),
      streak,
      timeSpentMinutes,
      lastActive: responses.length > 0 ? sortedResponses[0].timestamp : null
    };
  } catch (error) {
    throw new Error(`Failed to get user metrics: ${error.message}`);
  }
};

export const getClassMetrics = async (classId) => {
  try {
    // There is no class/enrollment model yet, so a "class" is every student account
    const users = await UserModel.find({ role: 'student' }).select('username theta').lean();
    const metricsArray = [];

    for (const user of users) {
      const responses = await ResponseModel.find({ user: user._id }).lean();
      const correctAnswers = responses.filter(r => r.correct).length;
      const totalAnswers = responses.length;

      metricsArray.push({
        username: user.username,
        totalQuestionsAttempted: totalAnswers,
        correctAnswers,
        accuracy: totalAnswers > 0 ? ((correctAnswers / totalAnswers) * 100).toFixed(2) : 0,
        theta: user.theta || 0
      });
    }

    return {
      classId,
      studentCount: metricsArray.length,
      students: metricsArray,
      averageAccuracy: metricsArray.length > 0
        ? (metricsArray.reduce((sum, m) => sum + parseFloat(m.accuracy), 0) / metricsArray.length).toFixed(2)
        : 0
    };
  } catch (error) {
    throw new Error(`Failed to get class metrics: ${error.message}`);
  }
};

export const getProgressReport = async (userId) => {
  try {
    const responses = await ResponseModel.find({ user: userId }).sort({ timestamp: 1 }).lean();
    const questions = await QuestionModel.find().lean();

    const progressByDifficulty = {};
    questions.forEach(q => {
      const difficulty = q.difficulty || 0;
      const key = `level_${Math.round(difficulty)}`;
      if (!progressByDifficulty[key]) {
        progressByDifficulty[key] = { attempted: 0, correct: 0 };
      }
    });

    responses.forEach(resp => {
      const q = questions.find(q => q._id.toString() === resp.question?.toString());
      if (q && progressByDifficulty[`level_${Math.round(q.difficulty || 0)}`]) {
        const key = `level_${Math.round(q.difficulty || 0)}`;
        progressByDifficulty[key].attempted++;
        if (resp.correct) progressByDifficulty[key].correct++;
      }
    });

    return {
      userId,
      timestamp: new Date(),
      progressByDifficulty,
      totalAttempts: responses.length,
      recentActivity: responses.slice(-10)
    };
  } catch (error) {
    throw new Error(`Failed to get progress report: ${error.message}`);
  }
};
