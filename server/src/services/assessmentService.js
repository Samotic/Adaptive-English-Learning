/**
 * Assessment Service
 * Comprehensive assessment engine with adaptive difficulty and NLP-based grading
 * Integrated from multiple assessment modules
 */

// ===============================
// Question Pool
// ===============================

export const assessmentQuestions = {
  easy: [
    // Fill-in-the-blank with choices
    {
      type: 'fill-in-the-blank',
      question: '🏠 The place where you live is called a _____.',
      options: ['house', 'car', 'park', 'store'],
      answer: 'house',
      difficulty: -2
    },
    {
      type: 'fill-in-the-blank',
      question: '🌈 Complete: The color of grass is _____.',
      options: ['green', 'blue', 'red', 'yellow'],
      answer: 'green',
      difficulty: -2
    },
    {
      type: 'fill-in-the-blank',
      question: '☕ Fill in: I drink _____ every morning.',
      options: ['coffee', 'tea', 'water', 'milk'],
      answer: 'coffee',
      difficulty: -1
    },
    {
      type: 'fill-in-the-blank',
      question: '🍎 The opposite of "small" is _____.',
      options: ['large', 'big', 'tiny', 'huge'],
      answer: 'large',
      difficulty: -1
    },
    {
      type: 'fill-in-the-blank',
      question: '😊 Complete: I am _____ today.',
      options: ['happy', 'sad', 'angry', 'tired'],
      answer: 'happy',
      difficulty: -1
    },
    // Multiple-choice
    {
      type: 'multiple-choice',
      question: '📓 Which sentence is grammatically correct?',
      options: ['They is playing', 'They are playing', 'They am playing', 'They be playing'],
      answer: 'They are playing',
      difficulty: 0
    },
    {
      type: 'multiple-choice',
      question: '💬 What is a polite way to greet someone?',
      options: ['Go away', 'Hello, how are you?', 'Be quiet', 'Leave me alone'],
      answer: 'Hello, how are you?',
      difficulty: -1
    },
    {
      type: 'multiple-choice',
      question: '🎓 What is the plural of "child"?',
      options: ['childs', 'childes', 'children', 'childern'],
      answer: 'children',
      difficulty: -1
    },
    {
      type: 'multiple-choice',
      question: '❄️ Complete: Water freezes at _____ degrees Celsius.',
      options: ['0', '10', '20', '100'],
      answer: '0',
      difficulty: 0
    },
    {
      type: 'multiple-choice',
      question: '🏃 He _____ very fast.',
      options: ['run', 'runs', 'running', 'ran'],
      answer: 'runs',
      difficulty: 0
    }
  ],
  medium: [
    // Fill-in-the-blank with choices
    {
      type: 'fill-in-the-blank',
      question: '💬 A polite greeting in English is _____.',
      options: ['Good morning', 'Whatever', 'Shh', 'Go away'],
      answer: 'Good morning',
      difficulty: 0
    },
    {
      type: 'fill-in-the-blank',
      question: '📚 They have _____ studying English for 3 years.',
      options: ['been', 'are', 'was', 'have'],
      answer: 'been',
      difficulty: 0.5
    },
    {
      type: 'fill-in-the-blank',
      question: '🎭 Complete: The actor\'s _____ was brilliant in the film.',
      options: ['performance', 'appearance', 'voice', 'movement'],
      answer: 'performance',
      difficulty: 0.5
    },
    {
      type: 'fill-in-the-blank',
      question: '💼 What does "collaborate" mean?',
      options: ['To work against', 'To work together', 'To compete', 'To ignore'],
      answer: 'To work together',
      difficulty: 0.5
    },
    {
      type: 'fill-in-the-blank',
      question: '🌍 The _____ of the problem requires careful analysis.',
      options: ['complexity', 'size', 'speed', 'color'],
      answer: 'complexity',
      difficulty: 0.5
    },
    // Multiple-choice
    {
      type: 'multiple-choice',
      question: '✈️ Choose the correct sentence:',
      options: ['Unless you will come, I stay home', 'Unless you come, I will stay home', 'Unless you come, I stay home', 'Unless you are coming, I will stay'],
      answer: 'Unless you come, I will stay home',
      difficulty: 0.5
    },
    {
      type: 'multiple-choice',
      question: '🏫 Which word is a synonym for "diligent"?',
      options: ['Lazy', 'Hardworking', 'Careless', 'Slow'],
      answer: 'Hardworking',
      difficulty: 0
    },
    {
      type: 'multiple-choice',
      question: '🎓 What is the past participle of "write"?',
      options: ['wrote', 'writing', 'written', 'writes'],
      answer: 'written',
      difficulty: 0.5
    },
    {
      type: 'multiple-choice',
      question: '📝 Which sentence uses the correct tense?',
      options: ['I have see the movie', 'I have saw the movie', 'I have seen the movie', 'I saw seeing the movie'],
      answer: 'I have seen the movie',
      difficulty: 0.5
    },
    {
      type: 'multiple-choice',
      question: '🌐 What does "eloquent" mean?',
      options: ['Quiet', 'Fluent and persuasive in speaking', 'Angry', 'Confused'],
      answer: 'Fluent and persuasive in speaking',
      difficulty: 1
    }
  ],
  hard: [
    // Fill-in-the-blank with choices
    {
      type: 'fill-in-the-blank',
      question: '⏳ What does "ephemeral" precisely mean?',
      options: ['Lasting a very short time', 'Permanent and unchanging', 'Loudly audible', 'Brilliantly shining'],
      answer: 'Lasting a very short time',
      difficulty: 1.5
    },
    {
      type: 'fill-in-the-blank',
      question: '🏫 The antonym of "benevolent" is _____.',
      options: ['malevolent', 'kind', 'generous', 'caring'],
      answer: 'malevolent',
      difficulty: 1.5
    },
    {
      type: 'fill-in-the-blank',
      question: '✨ "Quintessential" best exemplifies the _____ form of something.',
      options: ['most typical', 'most unique', 'most rare', 'most common'],
      answer: 'most typical',
      difficulty: 2
    },
    {
      type: 'fill-in-the-blank',
      question: '⚠️ Select the best definition of "pernicious":',
      options: ['Harmful or destructive, often in subtle ways', 'Completely harmless', 'Readily apparent', 'Fleeting in nature'],
      answer: 'Harmful or destructive, often in subtle ways',
      difficulty: 2
    },
    {
      type: 'fill-in-the-blank',
      question: '📝 In "She has been working since 2010," identify the verb tense: _____.',
      options: ['present perfect continuous', 'simple present', 'present perfect', 'present progressive'],
      answer: 'present perfect continuous',
      difficulty: 2
    },
    // Multiple-choice
    {
      type: 'multiple-choice',
      question: '💬 Which idiom means to be ungrateful to someone who helped you?',
      options: ['Break a leg', 'Bite the hand that feeds you', 'Hit the nail on the head', 'Barking up the wrong tree'],
      answer: 'Bite the hand that feeds you',
      difficulty: 2
    },
    {
      type: 'multiple-choice',
      question: '📚 What does "obfuscate" mean?',
      options: ['To clarify', 'To make obscure or unclear', 'To enlighten', 'To simplify'],
      answer: 'To make obscure or unclear',
      difficulty: 1.5
    },
    {
      type: 'multiple-choice',
      question: '🎓 Which word best describes someone who is "pragmatic"?',
      options: ['Idealistic', 'Practical and realistic', 'Theoretical', 'Impractical'],
      answer: 'Practical and realistic',
      difficulty: 1.5
    },
    {
      type: 'multiple-choice',
      question: '🔬 What is the meaning of "serendipitous"?',
      options: ['Planned', 'Occurring by luck or chance in a happy way', 'Unfortunate', 'Deliberate'],
      answer: 'Occurring by luck or chance in a happy way',
      difficulty: 2
    },
    {
      type: 'multiple-choice',
      question: '💡 Which sentence uses the subjunctive mood correctly?',
      options: ['If I was rich, I would travel', 'If I were rich, I will travel', 'If I were rich, I would travel', 'If I was rich, I will travel'],
      answer: 'If I were rich, I would travel',
      difficulty: 2
    },
    // Free-text question with semantic evaluation
    {
      id: 'hard-free-text-1',
      type: 'free-text',
      evaluationType: 'semantic',
      question: 'Free Response: Explain how consistent practice helps improve language fluency. Share at least three sentences describing specific strategies that work for you.',
      placeholder: 'Describe the study techniques that make the biggest difference for you...',
      minWordCount: 40,
      difficulty: 2
    }
  ]
};

// ===============================
// Submission Database (In-Memory)
// ===============================

const submissionDatabase = {
  submissions: [],
  save(record) {
    const index = this.submissions.findIndex(entry => entry.id === record.id);
    if (index >= 0) {
      this.submissions[index] = { ...this.submissions[index], ...record };
    } else {
      this.submissions.push(record);
      // Bounded: persisted grading lives in the Response collection; this is only a recent-activity log
      if (this.submissions.length > 500) this.submissions.shift();
    }
    return record;
  },
  getAll() {
    return this.submissions;
  },
  getById(id) {
    return this.submissions.find(entry => entry.id === id);
  }
};

// ===============================
// NLP Service for Semantic Analysis
// ===============================

export const NLPService = {
  analyzeSemantics(text) {
    const response = (text || '').trim();
    if (!response) {
      return {
        confidence: 0,
        grade: 0,
        feedback: 'The system could not detect any content. Please provide a response.'
      };
    }

    const words = response.split(/\s+/).filter(Boolean);
    const sentences = response.split(/[.!?]+/).filter(Boolean).length || 1;
    const uniqueWords = new Set(words.map(word => word.toLowerCase().replace(/[^a-z']/g, ''))).size;

    const lengthScore = Math.min(words.length / 150, 1);
    const coherenceScore = Math.min(sentences / 6, 1);
    const varietyScore = Math.min(uniqueWords / Math.max(words.length, 1), 1);

    const combinedScore = (lengthScore * 0.35) + (coherenceScore * 0.35) + (varietyScore * 0.3);
    const confidence = Number(Math.min(Math.max(combinedScore, 0), 1).toFixed(2));
    const grade = Math.round(confidence * 100);

    let feedback = 'Thoughtful, well-structured explanation with strong supporting detail.';
    if (grade < 40) {
      feedback = 'Add more detail and structure so the system can understand your strategy.';
    } else if (grade < 70) {
      feedback = 'Good start—expand on your examples and connect the ideas more clearly.';
    }

    return {
      confidence,
      grade,
      feedback
    };
  },

  /**
   * Analyze speech/spoken response for speaking module (FR23)
   * Evaluates fluency, vocabulary, and coherence from transcribed speech
   */
  analyzeSpeech(transcript, expectedTopic = null) {
    const response = (transcript || '').trim();
    if (!response) {
      return {
        confidence: 0,
        grade: 0,
        fluency: 0,
        vocabulary: 0,
        coherence: 0,
        feedback: 'No speech detected. Please try speaking again.'
      };
    }

    const words = response.split(/\s+/).filter(Boolean);
    const sentences = response.split(/[.!?]+/).filter(Boolean).length || 1;
    const uniqueWords = new Set(words.map(word => word.toLowerCase().replace(/[^a-z']/g, ''))).size;
    
    // Fluency: Based on length and natural speech patterns
    const fluencyScore = Math.min((words.length / 50) * 0.7 + (sentences / 3) * 0.3, 1);
    
    // Vocabulary: Diversity and complexity of word usage
    const vocabularyScore = Math.min(uniqueWords / Math.max(words.length * 0.7, 1), 1);
    
    // Coherence: Sentence structure and flow
    const avgWordsPerSentence = words.length / Math.max(sentences, 1);
    const coherenceScore = avgWordsPerSentence >= 5 && avgWordsPerSentence <= 20 ? 0.9 : 0.6;
    
    // Overall score
    const combinedScore = (fluencyScore * 0.4) + (vocabularyScore * 0.3) + (coherenceScore * 0.3);
    const confidence = Number(Math.min(Math.max(combinedScore, 0), 1).toFixed(2));
    const grade = Math.round(confidence * 100);

    let feedback = 'Excellent speaking performance! Clear, fluent, and well-structured.';
    if (grade < 40) {
      feedback = 'Try to speak more and use complete sentences. Practice will help!';
    } else if (grade < 70) {
      feedback = 'Good effort! Try to add more details and speak more naturally.';
    }

    return {
      confidence,
      grade,
      fluency: Math.round(fluencyScore * 100),
      vocabulary: Math.round(vocabularyScore * 100),
      coherence: Math.round(coherenceScore * 100),
      wordCount: words.length,
      sentenceCount: sentences,
      feedback
    };
  }
};

// ===============================
// Grading Service
// ===============================

export const GradingService = (() => {
  const confidenceThreshold = 0.72;
  const passingScore = 70;
  let submissionCounter = 1;

  function evaluateResponse(text, metadata = {}) {
    const semanticReport = NLPService.analyzeSemantics(text);

    const submissionRecord = {
      id: metadata.submissionId || `free-text-${submissionCounter++}`,
      promptId: metadata.promptId || 'free-text',
      studentId: metadata.studentId || 'anonymous',
      response: text,
      confidence: semanticReport.confidence,
      updatedAt: new Date().toISOString()
    };

    if (semanticReport.confidence < confidenceThreshold) {
      submissionRecord.status = 'pending_manual_review';
      submissionRecord.flagged = true;
      submissionRecord.statusDisplay = 'Flagged - Pending Manual Review';
      submissionRecord.feedback = 'Flagged for manual review because the confidence score was below the system threshold.';
      submissionDatabase.save(submissionRecord);

      return {
        status: 'pending_manual_review',
        confidence: semanticReport.confidence,
        grade: null,
        feedback: submissionRecord.feedback,
        threshold: confidenceThreshold
      };
    }

    submissionRecord.status = 'graded';
    submissionRecord.flagged = false;
    submissionRecord.statusDisplay = 'Auto-Graded';
    submissionRecord.grade = semanticReport.grade;
    submissionRecord.feedback = semanticReport.feedback;
    submissionDatabase.save(submissionRecord);

    return {
      status: 'graded',
      confidence: semanticReport.confidence,
      grade: semanticReport.grade,
      feedback: semanticReport.feedback,
      threshold: confidenceThreshold
    };
  }

  return {
    evaluateResponse,
    getThreshold: () => confidenceThreshold,
    getPassingScore: () => passingScore,
    getAllSubmissions: () => submissionDatabase.getAll(),
    getSubmissionById: (id) => submissionDatabase.getById(id)
  };
})();

// ===============================
// Utility Functions
// ===============================

export function requiresSemanticGrading(question) {
  return question && (question.type === 'free-text' || question.evaluationType === 'semantic');
}

/**
 * Get questions by difficulty level
 */
export const getQuestionsByDifficulty = (difficulty) => {
  if (difficulty < -1) return assessmentQuestions.easy;
  if (difficulty < 1) return assessmentQuestions.medium;
  return assessmentQuestions.hard;
};

/**
 * Get a random question from difficulty level
 */
export const getRandomQuestion = (difficulty) => {
  const questions = getQuestionsByDifficulty(difficulty);
  return questions[Math.floor(Math.random() * questions.length)];
};

/**
 * Evaluate answer (for multiple choice and fill-in-the-blank)
 */
export const evaluateAnswer = (questionId, userAnswer, correctAnswer) => {
  const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
  return {
    isCorrect,
    feedback: isCorrect ? "Correct! Great job!" : `The correct answer is: ${correctAnswer}`,
    timestamp: new Date()
  };
};

/**
 * Evaluate free-text answers
 */
export const evaluateFreeTextAnswer = (userAnswer, questionData = {}) => {
  const trimmed = (userAnswer || '').trim();
  const result = {
    isCorrect: false,
    message: '',
    feedbackClass: 'feedback',
    deferScoring: false,
    status: 'pending'
  };

  if (!trimmed) {
    result.message = 'Please enter your response before submitting.';
    result.deferScoring = true;
    return result;
  }

  if (questionData.minWordCount) {
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    if (wordCount < questionData.minWordCount) {
      result.message = `Please write at least ${questionData.minWordCount} words (current count: ${wordCount}).`;
      result.deferScoring = true;
      return result;
    }
  }

  const evaluation = GradingService.evaluateResponse(trimmed, {
    promptId: questionData.id || questionData.question
  });

  if (evaluation.status === 'pending_manual_review') {
    const confidencePercent = (evaluation.confidence * 100).toFixed(0);
    const thresholdPercent = (evaluation.threshold * 100).toFixed(0);
    result.message = `Response flagged for manual review. Confidence ${confidencePercent}% (threshold ${thresholdPercent}%). A teacher will review it shortly.`;
    result.status = evaluation.status;
    return result;
  }

  const isPassing = evaluation.grade >= GradingService.getPassingScore();
  const confidencePercent = (evaluation.confidence * 100).toFixed(0);
  result.isCorrect = isPassing;
  result.feedbackClass = `feedback ${isPassing ? 'correct' : 'incorrect'}`;
  result.message = `Auto-graded at ${evaluation.grade}/100 with ${confidencePercent}% confidence. Feedback: ${evaluation.feedback}`;
  result.status = evaluation.status;

  return result;
};

// ===============================
// Answer checking against the question bank (server-side, authoritative)
// ===============================

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'for', 'by', 'with', 'from',
  'is', 'are', 'was', 'were', 'be', 'been', 'it', 'its', 'this', 'that', 'as', 'something', 'someone',
  'thing', 'things', 'way', 'very', 'so', 'do', 'does', 'did'
]);

export function normalizeAnswer(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[“”"‘’'`]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[\s.!?,;:]+$/g, '')
    .trim();
}

const stem = (word) => (word.length > 4 ? word.replace(/(ing|ed|es|s)$/, '') : word);

function contentWords(text) {
  return normalizeAnswer(text)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w))
    .map(stem);
}

/**
 * Accepted answers for a reference: "a|b|c" alternatives, or short synonym lists such as
 * "joyful, cheerful, or glad" (every piece at most two words).
 */
export function answerAlternatives(reference) {
  const ref = String(reference ?? '');
  if (ref.includes('|')) return ref.split('|').map(normalizeAnswer).filter(Boolean);

  const alternatives = [normalizeAnswer(ref)];
  if (/,|\bor\b/.test(ref)) {
    const pieces = ref.split(/,|\bor\b/).map((p) => p.trim()).filter(Boolean);
    if (pieces.length > 1 && pieces.every((p) => p.split(/\s+/).length <= 2)) {
      alternatives.push(...pieces.map(normalizeAnswer));
    }
  }
  return alternatives.filter(Boolean);
}

export function checkObjectiveAnswer(question, userAnswer) {
  const given = normalizeAnswer(userAnswer);
  return Boolean(given) && answerAlternatives(question?.answer).includes(given);
}

export function isFreeTextQuestion(question) {
  return Boolean(question) && (
    ['free-text', 'essay', 'writing'].includes(question.type) ||
    question.evaluationType === 'semantic' ||
    question.isOpenEnded === true
  );
}

/** Essays and prompts without a usable answer key are graded on writing quality only. */
export function isOpenEndedQuestion(question) {
  const answer = normalizeAnswer(question?.answer);
  return !answer || answer === 'essay' || question?.type === 'essay' || question?.isOpenEnded === true;
}

/** Word overlap between the response and the best-matching accepted answer. */
export function gradeAgainstReference(reference, response) {
  const given = normalizeAnswer(response);
  const alternatives = answerAlternatives(reference);
  if (alternatives.includes(given)) return { grade: 100, confidence: 0.95 };

  const responseWords = new Set(contentWords(response));
  let best = 0;
  for (const alternative of alternatives) {
    const words = contentWords(alternative);
    if (words.length === 0) continue;
    const hits = words.filter((w) => responseWords.has(w)).length;
    best = Math.max(best, hits / words.length);
  }

  // Clear matches and clear misses are auto-graded; partial overlap is uncertain
  return { grade: Math.round(best * 100), confidence: best >= 0.75 || best <= 0.25 ? 0.9 : 0.5 };
}

const REVIEW_THRESHOLD = 0.72;
export const FREE_TEXT_PASS_GRADE = 70;

/**
 * Grades a free-text answer for a specific question. Low-confidence results are returned with
 * status "pending_manual_review" so a teacher can confirm them.
 */
export function evaluateFreeTextResponse(question, text) {
  const response = String(text ?? '').trim();
  if (!response) {
    return { status: 'graded', grade: 0, confidence: 1, feedback: 'No answer was provided.', threshold: REVIEW_THRESHOLD };
  }

  const requiredWord = /using the word ["“']?([a-z'-]+)["”']?/i.exec(question?.text || '')?.[1];
  let grade;
  let confidence;
  let feedback;

  if (requiredWord) {
    const words = response.split(/\s+/).filter(Boolean);
    const usesWord = new RegExp(`\\b${requiredWord}\\b`, 'i').test(response);
    if (!usesWord) {
      grade = 20; confidence = 0.95;
      feedback = `Your sentence must use the word "${requiredWord}".`;
    } else if (words.length < 5) {
      grade = 50; confidence = 0.6;
      feedback = 'Write a complete sentence with more context.';
    } else {
      grade = 85; confidence = 0.8;
      feedback = `Good use of "${requiredWord}" in a complete sentence.`;
    }
  } else if (isOpenEndedQuestion(question)) {
    ({ grade, confidence, feedback } = NLPService.analyzeSemantics(response));
  } else {
    ({ grade, confidence } = gradeAgainstReference(question.answer, response));
    feedback = grade >= FREE_TEXT_PASS_GRADE
      ? 'Correct! Your answer matches the expected meaning.'
      : 'Not quite. Compare your answer with the expected answer.';
  }

  if (confidence < REVIEW_THRESHOLD) {
    return {
      status: 'pending_manual_review',
      grade: null,
      provisionalGrade: grade,
      confidence,
      feedback: 'Your answer could not be graded automatically with confidence. A teacher will review it.',
      threshold: REVIEW_THRESHOLD
    };
  }
  return { status: 'graded', grade, confidence, feedback, threshold: REVIEW_THRESHOLD };
}

/**
 * Adapt difficulty based on performance
 */
export const adaptDifficulty = (currentLevel, correctAnswers, totalQuestions) => {
  if (totalQuestions >= 5) {
    const accuracy = correctAnswers / totalQuestions;
    if (accuracy >= 0.8 && currentLevel !== 'hard') {
      return currentLevel === 'easy' ? 'medium' : 'hard';
    } else if (accuracy < 0.6 && currentLevel !== 'easy') {
      return currentLevel === 'hard' ? 'medium' : 'easy';
    }
  }
  return currentLevel;
};
