import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  updateTheta,
  thetaToLevel,
  nextReviewDate,
  THETA_MAX,
  THETA_MIN
} from '../src/services/adaptiveEngine.js';
import {
  checkObjectiveAnswer,
  answerAlternatives,
  evaluateFreeTextResponse,
  normalizeAnswer
} from '../src/services/assessmentService.js';
import { csvCell } from '../src/services/reportExportService.js';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('adaptive engine', () => {
  test('theta rises after a correct answer and falls after a wrong one', () => {
    assert.ok(updateTheta(0, 0, true) > 0);
    assert.ok(updateTheta(0, 0, false) < 0);
  });

  test('a correct answer on a hard question moves theta more than on an easy one', () => {
    assert.ok(updateTheta(0, 2, true) > updateTheta(0, -2, true));
  });

  test('theta is bounded and tolerates missing values', () => {
    assert.equal(updateTheta(undefined, undefined, true), updateTheta(0, 0, true));
    assert.ok(updateTheta(THETA_MAX, -10, true) <= THETA_MAX);
    assert.ok(updateTheta(THETA_MIN, 10, false) >= THETA_MIN);
  });

  test('thetaToLevel maps ability to module levels', () => {
    assert.equal(thetaToLevel(-2), 0);
    assert.equal(thetaToLevel(-0.5), 1);
    assert.equal(thetaToLevel(0.5), 2);
    assert.equal(thetaToLevel(1.5), 3);
    assert.equal(thetaToLevel(3), 4);
    assert.equal(thetaToLevel(NaN), 2);
  });

  test('wrong answers are reviewed tomorrow; repeated correct answers space out', () => {
    const now = new Date('2026-01-10T00:00:00Z');
    assert.equal(nextReviewDate(null, false, now).getTime(), now.getTime() + DAY_MS);

    const threeDaysAgo = { correct: true, timestamp: new Date(now.getTime() - 3 * DAY_MS) };
    assert.equal(nextReviewDate(threeDaysAgo, true, now).getTime(), now.getTime() + 6 * DAY_MS);
    assert.equal(nextReviewDate(threeDaysAgo, false, now).getTime(), now.getTime() + DAY_MS);

    const longAgo = { correct: true, timestamp: new Date(now.getTime() - 100 * DAY_MS) };
    assert.equal(nextReviewDate(longAgo, true, now).getTime(), now.getTime() + 60 * DAY_MS);
  });
});

describe('objective answer checking', () => {
  test('ignores case, surrounding whitespace and trailing punctuation', () => {
    const question = { answer: 'Hello, how are you?' };
    assert.equal(checkObjectiveAnswer(question, '  hello, how are YOU '), true);
    assert.equal(normalizeAnswer('Went.'), 'went');
  });

  test('accepts pipe-separated alternatives', () => {
    assert.equal(checkObjectiveAnswer({ answer: 'lived|been living' }, 'been living'), true);
    assert.equal(checkObjectiveAnswer({ answer: 'lived|been living' }, 'live'), false);
  });

  test('rejects wrong and empty answers', () => {
    assert.equal(checkObjectiveAnswer({ answer: 'went' }, 'go'), false);
    assert.equal(checkObjectiveAnswer({ answer: 'went' }, ''), false);
    assert.equal(checkObjectiveAnswer({ answer: 'went' }, undefined), false);
  });

  test('splits short synonym lists into alternatives', () => {
    assert.deepEqual(answerAlternatives('joyful, cheerful, or glad').slice(1), ['joyful', 'cheerful', 'glad']);
    // long explanations are not split into fragments
    assert.equal(answerAlternatives('Although it was raining, we went for a walk.').length, 1);
  });
});

describe('free-text grading', () => {
  test('an exact or synonym match is auto-graded as correct', () => {
    const exact = evaluateFreeTextResponse({ answer: 'cold', type: 'free-text' }, 'Cold');
    assert.equal(exact.status, 'graded');
    assert.equal(exact.grade, 100);

    const synonym = evaluateFreeTextResponse({ answer: 'joyful, cheerful, or glad', type: 'free-text' }, 'glad');
    assert.equal(synonym.grade, 100);
  });

  test('an unrelated answer is auto-graded as incorrect', () => {
    const result = evaluateFreeTextResponse(
      { answer: 'a strong desire to succeed', type: 'free-text' },
      'a kind of fruit'
    );
    assert.equal(result.status, 'graded');
    assert.ok(result.grade < 70);
  });

  test('a partially matching answer is sent to a teacher', () => {
    const result = evaluateFreeTextResponse(
      { answer: 'the ability to recover or bounce back from difficulties', type: 'free-text' },
      'ability to recover'
    );
    assert.equal(result.status, 'pending_manual_review');
    assert.equal(result.grade, null);
  });

  test('"write a sentence using the word X" checks the word is used', () => {
    const question = { text: 'Write a sentence using the word "although".', answer: 'Although it was raining, we went out.', type: 'free-text' };
    assert.equal(evaluateFreeTextResponse(question, 'I stayed home because it rained.').grade, 20);
    const good = evaluateFreeTextResponse(question, 'Although I was tired, I finished my homework.');
    assert.equal(good.status, 'graded');
    assert.ok(good.grade >= 70);
  });

  test('empty answers score zero', () => {
    assert.equal(evaluateFreeTextResponse({ answer: 'cold' }, '   ').grade, 0);
  });
});

describe('CSV export', () => {
  test('quotes cells containing commas, quotes and newlines', () => {
    assert.equal(csvCell('a,b'), '"a,b"');
    assert.equal(csvCell('say "hi"'), '"say ""hi"""');
    assert.equal(csvCell(null), '');
  });

  test('neutralizes spreadsheet formulas', () => {
    assert.equal(csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`);
    assert.equal(csvCell('+1'), "'+1");
  });
});
