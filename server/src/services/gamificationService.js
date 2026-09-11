/**
 * Gamification Service - FR3: Achievement Badges/Points System
 * Handles badge awarding, progress tracking, and points calculation
 */

import BadgeModel from '../models/badge.js';
import UserBadgeModel from '../models/userBadge.js';
import UserModel from '../models/user.js';
import ResponseModel from '../models/response.js';
import * as notificationService from './notificationService.js';

class GamificationService {
  /**
   * Initialize default badges in the system
   */
  async initializeDefaultBadges() {
    const defaultBadges = [
      {
        name: 'First Steps',
        description: 'Answer your first question correctly',
        icon: '🎯',
        category: 'milestone',
        criteria: { type: 'questions_correct', threshold: 1 },
        points: 5,
        rarity: 'common'
      },
      {
        name: 'Quick Learner',
        description: 'Answer 10 questions correctly',
        icon: '🚀',
        category: 'achievement',
        criteria: { type: 'questions_correct', threshold: 10 },
        points: 15,
        rarity: 'common'
      },
      {
        name: 'Knowledge Seeker',
        description: 'Answer 50 questions correctly',
        icon: '📚',
        category: 'achievement',
        criteria: { type: 'questions_correct', threshold: 50 },
        points: 50,
        rarity: 'uncommon'
      },
      {
        name: 'Master Student',
        description: 'Answer 100 questions correctly',
        icon: '🎓',
        category: 'achievement',
        criteria: { type: 'questions_correct', threshold: 100 },
        points: 100,
        rarity: 'rare'
      },
      {
        name: 'Dedication',
        description: 'Maintain a 7-day learning streak',
        icon: '🔥',
        category: 'streak',
        criteria: { type: 'streak_days', threshold: 7 },
        points: 30,
        rarity: 'uncommon'
      },
      {
        name: 'Reading Master',
        description: 'Master the reading skill (theta >= 1.5)',
        icon: '📖',
        category: 'mastery',
        criteria: { type: 'theta_threshold', threshold: 1.5, skill: 'reading' },
        points: 75,
        rarity: 'rare'
      },
      {
        name: 'Writing Wizard',
        description: 'Master the writing skill (theta >= 1.5)',
        icon: '✍️',
        category: 'mastery',
        criteria: { type: 'theta_threshold', threshold: 1.5, skill: 'writing' },
        points: 75,
        rarity: 'rare'
      },
      {
        name: 'Listening Legend',
        description: 'Master the listening skill (theta >= 1.5)',
        icon: '👂',
        category: 'mastery',
        criteria: { type: 'theta_threshold', threshold: 1.5, skill: 'listening' },
        points: 75,
        rarity: 'rare'
      },
      {
        name: 'Speaking Star',
        description: 'Master the speaking skill (theta >= 1.5)',
        icon: '🗣️',
        category: 'mastery',
        criteria: { type: 'theta_threshold', threshold: 1.5, skill: 'speaking' },
        points: 75,
        rarity: 'rare'
      },
      {
        name: 'Perfect Score',
        description: 'Get 100% accuracy on 10 consecutive questions',
        icon: '💯',
        category: 'achievement',
        criteria: { type: 'custom', threshold: 10, metadata: { type: 'perfect_streak' } },
        points: 50,
        rarity: 'epic'
      },
      {
        name: 'Expert',
        description: 'Reach expert level (theta >= 2.0)',
        icon: '👑',
        category: 'milestone',
        criteria: { type: 'theta_threshold', threshold: 2.0 },
        points: 150,
        rarity: 'legendary'
      }
    ];

    for (const badgeData of defaultBadges) {
      try {
        await BadgeModel.findOneAndUpdate(
          { name: badgeData.name },
          badgeData,
          { upsert: true, new: true }
        );
      } catch (e) {
        console.log(`Badge "${badgeData.name}" already exists`);
      }
    }

    console.log('✅ Default badges initialized');
  }

  /**
   * Check and award badges to user based on their progress
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of newly awarded badges
   */
  async checkAndAwardBadges(userId) {
    const user = await UserModel.findById(userId);
    if (!user) return [];

    const allBadges = await BadgeModel.find({ isActive: true });
    const userBadges = await UserBadgeModel.find({ user: userId }).populate('badge');
    const earnedBadgeIds = userBadges.filter(ub => ub.badge).map(ub => ub.badge._id.toString());

    const newlyAwarded = [];

    for (const badge of allBadges) {
      // Skip if already earned
      if (earnedBadgeIds.includes(badge._id.toString())) continue;

      const qualifies = await this.checkBadgeCriteria(userId, badge);
      
      if (qualifies) {
        try {
          await UserBadgeModel.create({
            user: userId,
            badge: badge._id,
            earnedAt: new Date()
          });

          // Award points atomically (concurrent answers must not lose points)
          await UserModel.updateOne({ _id: userId }, { $inc: { points: badge.points } });
          await notificationService.sendMilestoneAchieved(
            userId,
            `${badge.icon} ${badge.name} badge (+${badge.points} points)`
          );

          newlyAwarded.push({
            ...badge.toObject(),
            points: badge.points
          });
        } catch (e) {
          // Badge already exists (race condition)
          console.log(`Badge "${badge.name}" already awarded to user`);
        }
      }
    }

    return newlyAwarded;
  }

  /**
   * Check if user meets badge criteria
   * @param {string} userId - User ID
   * @param {Object} badge - Badge object
   * @returns {Promise<boolean>} Whether user qualifies
   */
  async checkBadgeCriteria(userId, badge) {
    const { criteria } = badge;

    switch (criteria.type) {
      case 'questions_correct': {
        const correctCount = await ResponseModel.countDocuments({
          user: userId,
          correct: true
        });
        return correctCount >= criteria.threshold;
      }

      case 'theta_threshold': {
        const user = await UserModel.findById(userId).select('theta').lean();
        const theta = user?.theta ?? 0;
        if (criteria.skill) {
          // For skill-specific badges, check responses for that skill
          const skillResponses = await ResponseModel.find({ user: userId })
            .populate('question');
          const skillFiltered = skillResponses.filter(r => r.question?.skill === criteria.skill);
          if (skillFiltered.length < 10) return false; // Need minimum responses
          
          // Calculate skill-specific accuracy
          const correct = skillFiltered.filter(r => r.correct).length;
          const skillAccuracy = correct / skillFiltered.length;
          return skillAccuracy >= 0.8 && theta >= criteria.threshold;
        }
        return theta >= criteria.threshold;
      }

      case 'streak_days': {
        const streak = await this.calculateStreak(userId);
        return streak >= criteria.threshold;
      }

      case 'custom': {
        if (criteria.metadata?.type === 'perfect_streak') {
          return await this.checkPerfectStreak(userId, criteria.threshold);
        }
        return false;
      }

      default:
        return false;
    }
  }

  /**
   * Calculate user's current learning streak
   * @param {string} userId - User ID
   * @returns {Promise<number>} Streak in days
   */
  async calculateStreak(userId) {
    const responses = await ResponseModel.find({ user: userId })
      .sort({ timestamp: -1 })
      .lean();

    if (responses.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < responses.length; i++) {
      const responseDate = new Date(responses[i].timestamp);
      responseDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((currentDate - responseDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
        currentDate = new Date(responseDate);
      } else if (daysDiff > streak) {
        break;
      }
    }

    return streak;
  }

  /**
   * Check if user has perfect streak of correct answers
   * @param {string} userId - User ID
   * @param {number} required - Required streak length
   * @returns {Promise<boolean>} Has perfect streak
   */
  async checkPerfectStreak(userId, required) {
    const recentResponses = await ResponseModel.find({ user: userId })
      .sort({ timestamp: -1 })
      .limit(required)
      .lean();

    if (recentResponses.length < required) return false;

    return recentResponses.every(r => r.correct);
  }

  /**
   * Get user's badges and points
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Badges and points data
   */
  async getUserGamification(userId) {
    const user = await UserModel.findById(userId).select('points').lean();
    if (!user) throw new Error('User not found');
    const userBadges = (await UserBadgeModel.find({ user: userId })
      .populate('badge')
      .sort({ earnedAt: -1 }))
      .filter(ub => ub.badge);

    const totalPoints = user.points || 0;
    const badgesByRarity = {
      common: userBadges.filter(ub => ub.badge.rarity === 'common').length,
      uncommon: userBadges.filter(ub => ub.badge.rarity === 'uncommon').length,
      rare: userBadges.filter(ub => ub.badge.rarity === 'rare').length,
      epic: userBadges.filter(ub => ub.badge.rarity === 'epic').length,
      legendary: userBadges.filter(ub => ub.badge.rarity === 'legendary').length
    };

    return {
      totalPoints,
      totalBadges: userBadges.length,
      badges: userBadges.map(ub => ({
        ...ub.badge.toObject(),
        earnedAt: ub.earnedAt
      })),
      badgesByRarity,
      streak: await this.calculateStreak(userId)
    };
  }

  /**
   * Get leaderboard
   * @param {number} limit - Number of top users
   * @returns {Promise<Array>} Leaderboard data
   */
  async getLeaderboard(limit = 10) {
    const users = await UserModel.find({ role: 'student' })
      .select('username firstName lastName points theta')
      .sort({ points: -1 })
      .limit(limit)
      .lean();

    return await Promise.all(users.map(async (user, index) => {
      const badges = await UserBadgeModel.countDocuments({ user: user._id });
      return {
        rank: index + 1,
        username: user.username,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        points: user.points || 0,
        badges,
        theta: Number(user.theta ?? 0).toFixed(2)
      };
    }));
  }
}

export default new GamificationService();
