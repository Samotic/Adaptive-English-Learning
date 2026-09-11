/**
 * Adaptive engine: ability estimation (1-parameter IRT / Elo-style update) and spaced repetition.
 * Pure functions so they can be unit tested without a database.
 */

export const THETA_LEARNING_RATE = 0.5;
export const THETA_MIN = -4;
export const THETA_MAX = 4;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_REVIEW_INTERVAL_DAYS = 60;

const finiteOr = (value, fallback) => (Number.isFinite(value) ? value : fallback);

/** P(correct) under the 2PL IRT model. */
export function expectedCorrectness(theta, difficulty, discrimination = 1) {
  return 1 / (1 + Math.exp(-discrimination * (theta - difficulty)));
}

/** Moves theta towards the observed result; bounded to [THETA_MIN, THETA_MAX]. */
export function updateTheta(theta, difficulty, correct, learningRate = THETA_LEARNING_RATE) {
  const current = finiteOr(theta, 0);
  const expected = expectedCorrectness(current, finiteOr(difficulty, 0));
  const next = current + learningRate * ((correct ? 1 : 0) - expected);
  return Math.min(THETA_MAX, Math.max(THETA_MIN, next));
}

/** Maps theta to the 0-4 module level scale used by the learning path. */
export function thetaToLevel(theta) {
  const t = finiteOr(theta, 0);
  if (t < -1) return 0;
  if (t < 0) return 1;
  if (t < 1) return 2;
  if (t < 2) return 3;
  return 4;
}

/**
 * Spaced repetition: a wrong answer is due again tomorrow; a correct answer that follows
 * a correct answer doubles the gap since that attempt (1 to 60 days).
 */
export function nextReviewDate(lastResponse, correct, now = new Date()) {
  let intervalDays = 1;
  if (correct && lastResponse?.correct && lastResponse.timestamp) {
    const daysSince = (now.getTime() - new Date(lastResponse.timestamp).getTime()) / DAY_MS;
    intervalDays = Math.max(1, daysSince * 2);
  }
  return new Date(now.getTime() + Math.min(intervalDays, MAX_REVIEW_INTERVAL_DAYS) * DAY_MS);
}
