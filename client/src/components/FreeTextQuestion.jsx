import React, { useState } from 'react';
import { AlertCircle, Check, X } from 'lucide-react';

/**
 * Free-Text Question Component
 * Handles fill-in-the-blank, short answer, and essay questions
 */
export default function FreeTextQuestion({ question, onSubmit, loading }) {
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userAnswer.trim()) {
      setFeedback({ type: 'error', message: 'Please provide an answer.' });
      return;
    }

    setSubmitted(true);
    onSubmit(userAnswer);
  };

  // Simple similarity check for free-text answers (case-insensitive, word-order flexible)
  const checkAnswer = (userText, correctText) => {
    const normalize = (text) =>
      text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .sort();

    const userWords = normalize(userText);
    const correctWords = normalize(correctText);

    // For multiple accepted answers separated by "/"
    const answers = correctText.split('/').map((a) => normalize(a));
    return answers.some(
      (ans) =>
        ans.length === userWords.length &&
        ans.every((word, i) => word === userWords[i])
    );
  };

  const isCorrect = checkAnswer(userAnswer, question.answer);

  return (
    <div className="free-text-question-container">
      <div className="question-card">
        <h3 className="question-text">{question.text}</h3>

        {question.audioUrl && (
          <div className="audio-player-section">
            <label className="audio-label">🎧 Listen:</label>
            <audio controls className="audio-player">
              <source src={question.audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
            {question.audioText && (
              <details className="audio-transcript">
                <summary>Show transcript</summary>
                <p className="transcript-text">{question.audioText}</p>
              </details>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="question-form">
          {question.type === 'fill-in-blank' ? (
            <div className="fill-in-blank-wrapper">
              <p className="instruction-text">Fill in the blank:</p>
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer..."
                className="free-text-input fill-in-blank-input"
                disabled={submitted}
              />
            </div>
          ) : (
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer here..."
              rows={question.type === 'free-text' ? 4 : 6}
              className="free-text-input"
              disabled={submitted}
            />
          )}

          <button
            type="submit"
            disabled={loading || submitted}
            className="submit-button"
          >
            {loading ? 'Checking...' : 'Submit Answer'}
          </button>
        </form>

        {submitted && (
          <div
            className={`answer-feedback ${isCorrect ? 'correct' : 'incorrect'}`}
          >
            <div className="feedback-header">
              {isCorrect ? (
                <>
                  <Check size={24} className="feedback-icon correct-icon" />
                  <span className="feedback-title">Correct!</span>
                </>
              ) : (
                <>
                  <X size={24} className="feedback-icon incorrect-icon" />
                  <span className="feedback-title">Not quite right</span>
                </>
              )}
            </div>

            {!isCorrect && (
              <div className="correct-answer-section">
                <strong>Expected answer:</strong>
                <p className="correct-answer">{question.answer}</p>
                <strong>Your answer:</strong>
                <p className="user-answer">{userAnswer}</p>
              </div>
            )}

            {question.explanation && (
              <div className="explanation-section">
                <strong>Explanation:</strong>
                <p className="explanation-text">{question.explanation}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setUserAnswer('');
                setFeedback(null);
                setSubmitted(false);
              }}
              className="try-again-button"
            >
              Try Again
            </button>
          </div>
        )}

        {feedback && !submitted && (
          <div className={`inline-feedback ${feedback.type}`}>
            <AlertCircle size={16} />
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .free-text-question-container {
          width: 100%;
          max-width: 800px;
          margin: 20px auto;
        }

        .question-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .question-text {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 20px;
          line-height: 1.6;
        }

        .audio-player-section {
          margin: 20px 0;
          padding: 15px;
          background: #f5f9ff;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }

        .audio-label {
          display: block;
          font-weight: 600;
          margin-bottom: 10px;
          color: #333;
        }

        .audio-player {
          width: 100%;
          margin-bottom: 10px;
        }

        .audio-transcript {
          margin-top: 10px;
          padding: 10px;
          background: #f0f0f0;
          border-radius: 4px;
          cursor: pointer;
        }

        .audio-transcript summary {
          font-weight: 500;
          color: #667eea;
        }

        .transcript-text {
          margin-top: 10px;
          padding: 10px;
          background: white;
          border-radius: 4px;
          font-style: italic;
          color: #555;
          line-height: 1.6;
        }

        .question-form {
          margin: 20px 0;
        }

        .fill-in-blank-wrapper {
          margin-bottom: 15px;
        }

        .instruction-text {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }

        .free-text-input {
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          transition: border-color 0.3s;
        }

        .free-text-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .free-text-input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .fill-in-blank-input {
          font-weight: 600;
        }

        .submit-button {
          width: 100%;
          padding: 12px;
          margin-top: 15px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
        }

        .submit-button:hover:not(:disabled) {
          background: #5568d3;
        }

        .submit-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .answer-feedback {
          margin-top: 20px;
          padding: 16px;
          border-radius: 8px;
          border-left: 5px solid;
        }

        .answer-feedback.correct {
          background-color: #d4edda;
          border-color: #28a745;
        }

        .answer-feedback.incorrect {
          background-color: #f8d7da;
          border-color: #dc3545;
        }

        .feedback-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }

        .feedback-icon {
          flex-shrink: 0;
        }

        .correct-icon {
          color: #28a745;
        }

        .incorrect-icon {
          color: #dc3545;
        }

        .feedback-title {
          font-weight: 600;
          font-size: 16px;
        }

        .answer-feedback.correct .feedback-title {
          color: #28a745;
        }

        .answer-feedback.incorrect .feedback-title {
          color: #dc3545;
        }

        .correct-answer-section {
          margin: 15px 0;
          padding: 12px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 6px;
        }

        .correct-answer-section strong {
          display: block;
          margin-top: 8px;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .correct-answer-section strong:first-child {
          margin-top: 0;
        }

        .correct-answer,
        .user-answer {
          margin: 4px 0 12px 0;
          padding: 8px;
          background: white;
          border-radius: 4px;
          font-weight: 500;
          font-family: 'Courier New', monospace;
          color: #333;
          word-break: break-word;
        }

        .explanation-section {
          margin: 15px 0;
          padding: 12px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 6px;
        }

        .explanation-section strong {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .explanation-text {
          margin: 0;
          padding: 8px;
          background: white;
          border-radius: 4px;
          color: #555;
          line-height: 1.6;
        }

        .try-again-button {
          width: 100%;
          padding: 10px;
          margin-top: 15px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
        }

        .try-again-button:hover {
          background: #5568d3;
        }

        .inline-feedback {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          padding: 10px;
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 6px;
          color: #856404;
          font-size: 14px;
        }

        .inline-feedback.error {
          background: #f8d7da;
          border-color: #dc3545;
          color: #721c24;
        }
      `}</style>
    </div>
  );
}
