import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import tracker from '../utils/trainingDataTracker';

/**
 * React Hook for Training Data Tracking
 * Automatically tracks page views and provides tracking functions
 */
export function useTrainingDataTracker() {
  const location = useLocation();
  const previousLocation = useRef(location.pathname);

  // Track page views automatically
  useEffect(() => {
    if (location.pathname !== previousLocation.current) {
      tracker.trackPageView(location.pathname);
      previousLocation.current = location.pathname;
    }
  }, [location]);

  // Provide wrapped tracking functions
  const trackQuizAnswer = useCallback((questionId, answerCorrect, responseTime, additionalData) => {
    return tracker.trackQuizAnswer(questionId, answerCorrect, responseTime, additionalData);
  }, []);

  const trackClick = useCallback((elementClicked, timeSpent = 0) => {
    return tracker.trackClick(elementClicked, timeSpent);
  }, []);

  const trackModuleStart = useCallback((moduleId, moduleLevel, moduleSkill) => {
    return tracker.trackModuleStart(moduleId, moduleLevel, moduleSkill);
  }, []);

  const trackModuleComplete = useCallback((moduleId, moduleLevel, moduleSkill, timeSpent) => {
    return tracker.trackModuleComplete(moduleId, moduleLevel, moduleSkill, timeSpent);
  }, []);

  const trackInteraction = useCallback((interactionData) => {
    return tracker.trackInteraction(interactionData);
  }, []);

  return {
    trackQuizAnswer,
    trackClick,
    trackModuleStart,
    trackModuleComplete,
    trackInteraction
  };
}

/**
 * Higher-Order Component for tracking page time
 */
export function withPageTimeTracking(Component) {
  return function TrackedComponent(props) {
    const startTime = useRef(Date.now());
    const location = useLocation();

    useEffect(() => {
      startTime.current = Date.now();

      return () => {
        const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
        if (timeSpent > 2) { // Only track if spent more than 2 seconds
          tracker.trackClick(`page_${location.pathname}`, timeSpent);
        }
      };
    }, [location.pathname]);

    return <Component {...props} />;
  };
}
