import TrainingDataModel from '../models/trainingData.js';
import UserModel from '../models/user.js';

/**
 * Data Collection Service for AI Model Retraining
 * Handles collection and storage of anonymized student interactions
 * UC18: Retrain/Update AI Models
 */

/**
 * Record a student interaction for training data
 * @param {Object} interactionData - The interaction data to record
 * @returns {Promise<Object>} The saved training data record
 */
export async function recordInteraction(interactionData) {
  try {
    const {
      userId,
      interactionType,
      questionId,
      questionDifficulty,
      answerCorrect,
      responseTime,
      moduleId,
      moduleLevel,
      moduleSkill,
      timeSpent,
      sessionDuration,
      elementClicked,
      pageUrl,
      previousPage,
      consecutiveCorrect,
      consecutiveIncorrect,
      sessionQuestionsAnswered,
      metadata
    } = interactionData;

    // Get user context (level/role) for anonymized metadata, and respect consent (FR19):
    // interaction data is only collected after the user opts in to analytics.
    const user = await UserModel.findById(userId)
      .select('theta role analyticsConsent dataProcessingConsent')
      .lean();
    if (!user) {
      return { success: false, skipped: true, reason: 'user_not_found' };
    }
    if (user.analyticsConsent !== true || user.dataProcessingConsent === false) {
      return { success: true, skipped: true, reason: 'no_consent' };
    }

    // Anonymize userId
    const anonymizedUserId = TrainingDataModel.anonymizeUserId(userId);

    const trainingData = new TrainingDataModel({
      anonymizedUserId,
      userLevel: user.theta,
      userRole: user.role,
      interactionType,
      questionId,
      questionDifficulty,
      answerCorrect,
      responseTime,
      moduleId,
      moduleLevel,
      moduleSkill,
      timeSpent,
      sessionDuration,
      elementClicked,
      pageUrl,
      previousPage,
      consecutiveCorrect,
      consecutiveIncorrect,
      sessionQuestionsAnswered,
      metadata,
      timestamp: new Date()
    });

    await trainingData.save();
    return { success: true, id: trainingData._id };
  } catch (error) {
    console.error('Error recording interaction:', error);
    throw error;
  }
}

/**
 * Record a quiz answer interaction
 */
export async function recordQuizAnswer(userId, questionId, answerCorrect, responseTime, additionalData = {}) {
  const question = additionalData.question;
  
  return await recordInteraction({
    userId,
    interactionType: 'quiz_answer',
    questionId,
    questionDifficulty: question?.difficulty || additionalData.questionDifficulty,
    answerCorrect,
    responseTime,
    moduleId: additionalData.moduleId,
    moduleLevel: additionalData.moduleLevel,
    moduleSkill: additionalData.moduleSkill,
    consecutiveCorrect: additionalData.consecutiveCorrect,
    consecutiveIncorrect: additionalData.consecutiveIncorrect,
    sessionQuestionsAnswered: additionalData.sessionQuestionsAnswered,
    metadata: additionalData.metadata
  });
}

/**
 * Record a click interaction
 */
export async function recordClick(userId, elementClicked, pageUrl, timeSpent = 0) {
  return await recordInteraction({
    userId,
    interactionType: 'click',
    elementClicked,
    pageUrl,
    timeSpent
  });
}

/**
 * Record a page view
 */
export async function recordPageView(userId, pageUrl, previousPage, timeSpent = 0) {
  return await recordInteraction({
    userId,
    interactionType: 'page_view',
    pageUrl,
    previousPage,
    timeSpent
  });
}

/**
 * Record module start
 */
export async function recordModuleStart(userId, moduleId, moduleLevel, moduleSkill) {
  return await recordInteraction({
    userId,
    interactionType: 'module_start',
    moduleId,
    moduleLevel,
    moduleSkill
  });
}

/**
 * Record module completion
 */
export async function recordModuleComplete(userId, moduleId, moduleLevel, moduleSkill, timeSpent) {
  return await recordInteraction({
    userId,
    interactionType: 'module_complete',
    moduleId,
    moduleLevel,
    moduleSkill,
    timeSpent
  });
}

/**
 * Record session start/end
 */
export async function recordSession(userId, type, sessionDuration = 0) {
  return await recordInteraction({
    userId,
    interactionType: type === 'start' ? 'session_start' : 'session_end',
    sessionDuration
  });
}

/**
 * Get training data for export (anonymized)
 * @param {Object} filters - Query filters
 * @returns {Promise<Array>} Training data records
 */
export async function getTrainingData(filters = {}) {
  try {
    const {
      startDate,
      endDate,
      interactionType,
      limit = 1000,
      skip = 0
    } = filters;

    const query = {};
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    if (interactionType) {
      query.interactionType = interactionType;
    }

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 1000, 1), 10000);
    const safeSkip = Math.max(parseInt(skip, 10) || 0, 0);

    const data = await TrainingDataModel.find(query)
      .sort({ timestamp: -1 })
      .limit(safeLimit)
      .skip(safeSkip)
      .lean();

    return data;
  } catch (error) {
    console.error('Error fetching training data:', error);
    throw error;
  }
}

/**
 * Get training data statistics
 */
export async function getTrainingDataStats() {
  try {
    const totalRecords = await TrainingDataModel.countDocuments();
    
    const interactionTypeCounts = await TrainingDataModel.aggregate([
      {
        $group: {
          _id: '$interactionType',
          count: { $sum: 1 }
        }
      }
    ]);

    const dateRange = await TrainingDataModel.aggregate([
      {
        $group: {
          _id: null,
          earliest: { $min: '$timestamp' },
          latest: { $max: '$timestamp' }
        }
      }
    ]);

    const uniqueUsers = await TrainingDataModel.distinct('anonymizedUserId');

    return {
      totalRecords,
      uniqueAnonymizedUsers: uniqueUsers.length,
      interactionTypes: interactionTypeCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      dateRange: dateRange[0] || { earliest: null, latest: null }
    };
  } catch (error) {
    console.error('Error fetching training data stats:', error);
    throw error;
  }
}

/**
 * Export training data in batch for ML training
 */
export async function exportTrainingDataBatch(batchSize = 10000, batchNumber = 0) {
  try {
    const skip = batchNumber * batchSize;
    const data = await TrainingDataModel.find()
      .sort({ timestamp: 1 })
      .limit(batchSize)
      .skip(skip)
      .lean();

    return {
      batchNumber,
      recordCount: data.length,
      data
    };
  } catch (error) {
    console.error('Error exporting training data batch:', error);
    throw error;
  }
}

/**
 * Clear old training data (for data retention policies)
 */
export async function clearOldTrainingData(daysToKeep = 365) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await TrainingDataModel.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    return {
      success: true,
      deletedCount: result.deletedCount
    };
  } catch (error) {
    console.error('Error clearing old training data:', error);
    throw error;
  }
}
