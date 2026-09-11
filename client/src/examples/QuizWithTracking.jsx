/**
 * Example: Quiz Component with Training Data Tracking
 * Shows how to integrate the training data tracker into quiz functionality
 */

import { useState, useEffect } from 'react';
import { useTrainingDataTracker } from '../hooks/useTrainingDataTracker';

function QuizWithTracking({ question, module, onAnswer }) {
  const [answer, setAnswer] = useState('');
  const [startTime] = useState(Date.now());
  const { trackQuizAnswer } = useTrainingDataTracker();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Calculate response time
    const responseTime = Math.floor((Date.now() - startTime) / 1000);
    
    // Check if answer is correct
    const isCorrect = answer.trim().toLowerCase() === question.answer.toLowerCase();
    
    // Track the quiz answer for training data
    await trackQuizAnswer(
      question._id,
      isCorrect,
      responseTime,
      {
        questionDifficulty: question.difficulty,
        moduleId: module?._id,
        moduleLevel: module?.level,
        moduleSkill: module?.skill,
        metadata: {
          questionType: question.type || 'text',
          attemptNumber: 1
        }
      }
    );
    
    // Continue with normal quiz logic
    onAnswer({ correct: isCorrect, answer, responseTime });
  };

  return (
    <div className="quiz-container">
      <h3>{question.text}</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your answer..."
        />
        <button type="submit">Submit Answer</button>
      </form>
    </div>
  );
}

export default QuizWithTracking;
