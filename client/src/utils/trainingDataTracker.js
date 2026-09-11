/**
 * Training Data Tracker - Client Side
 * Captures student interactions for AI model retraining
 * UC18: Retrain/Update AI Models - Data Collection
 */

import { API_BASE as API_ORIGIN } from '../api';

const API_BASE = `${API_ORIGIN}/api`;

class TrainingDataTracker {
  constructor() {
    this.sessionStartTime = Date.now();
    this.currentPage = window.location.pathname;
    this.pageStartTime = Date.now();
    this.sessionMetrics = {
      questionsAnswered: 0,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0
    };
  }

  /**
   * Get auth token from localStorage
   */
  getToken() {
    return localStorage.getItem('token');
  }

  /**
   * Make API call to record training data
   */
  async sendData(endpoint, data) {
    const token = this.getToken();
    if (!token) return; // Don't track if not logged in

    try {
      await fetch(`${API_BASE}/training-data/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Error sending training data:', error);
      // Fail silently - don't interrupt user experience
    }
  }

  /**
   * Track quiz answer
   */
  async trackQuizAnswer(questionId, answerCorrect, responseTime, additionalData = {}) {
    this.sessionMetrics.questionsAnswered++;
    
    if (answerCorrect) {
      this.sessionMetrics.consecutiveCorrect++;
      this.sessionMetrics.consecutiveIncorrect = 0;
    } else {
      this.sessionMetrics.consecutiveIncorrect++;
      this.sessionMetrics.consecutiveCorrect = 0;
    }

    await this.sendData('quiz-answer', {
      questionId,
      answerCorrect,
      responseTime,
      additionalData: {
        ...additionalData,
        consecutiveCorrect: this.sessionMetrics.consecutiveCorrect,
        consecutiveIncorrect: this.sessionMetrics.consecutiveIncorrect,
        sessionQuestionsAnswered: this.sessionMetrics.questionsAnswered
      }
    });
  }

  /**
   * Track click interaction
   */
  async trackClick(elementClicked, timeSpent = 0) {
    await this.sendData('click', {
      elementClicked,
      pageUrl: window.location.pathname,
      timeSpent
    });
  }

  /**
   * Track page view
   */
  async trackPageView(newPage) {
    const timeSpent = Math.floor((Date.now() - this.pageStartTime) / 1000);
    const previousPage = this.currentPage;
    
    await this.sendData('page-view', {
      pageUrl: newPage,
      previousPage,
      timeSpent
    });

    this.currentPage = newPage;
    this.pageStartTime = Date.now();
  }

  /**
   * Track module start
   */
  async trackModuleStart(moduleId, moduleLevel, moduleSkill) {
    await this.sendData('module-start', {
      moduleId,
      moduleLevel,
      moduleSkill
    });
  }

  /**
   * Track module completion
   */
  async trackModuleComplete(moduleId, moduleLevel, moduleSkill, timeSpent) {
    await this.sendData('module-complete', {
      moduleId,
      moduleLevel,
      moduleSkill,
      timeSpent
    });
  }

  /**
   * Track session start
   */
  async trackSessionStart() {
    this.sessionStartTime = Date.now();
    await this.sendData('session', {
      type: 'start',
      sessionDuration: 0
    });
  }

  /**
   * Track session end
   */
  async trackSessionEnd() {
    const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    await this.sendData('session', {
      type: 'end',
      sessionDuration
    });
  }

  /**
   * Track generic interaction
   */
  async trackInteraction(interactionData) {
    await this.sendData('record', interactionData);
  }

  /**
   * Setup automatic tracking
   */
  setupAutoTracking() {
    // Track session start on load
    this.trackSessionStart();

    // Track session end on page unload
    window.addEventListener('beforeunload', () => {
      // fetch with keepalive survives page unload and, unlike sendBeacon, can send the auth header
      const token = this.getToken();
      if (token) {
        const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        const data = JSON.stringify({
          type: 'end',
          sessionDuration
        });
        
        fetch(`${API_BASE}/training-data/session`, {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: data
        }).catch(() => {});
      }
    });

    // Track visibility changes (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // User switched away - could track this
      } else {
        // User came back
      }
    });
  }
}

// Create singleton instance
const tracker = new TrainingDataTracker();

// Auto-setup tracking
if (typeof window !== 'undefined') {
  tracker.setupAutoTracking();
}

export default tracker;

// Named exports for convenience
export const trackQuizAnswer = tracker.trackQuizAnswer.bind(tracker);
export const trackClick = tracker.trackClick.bind(tracker);
export const trackPageView = tracker.trackPageView.bind(tracker);
export const trackModuleStart = tracker.trackModuleStart.bind(tracker);
export const trackModuleComplete = tracker.trackModuleComplete.bind(tracker);
export const trackSessionStart = tracker.trackSessionStart.bind(tracker);
export const trackSessionEnd = tracker.trackSessionEnd.bind(tracker);
export const trackInteraction = tracker.trackInteraction.bind(tracker);
