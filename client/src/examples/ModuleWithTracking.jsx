/**
 * Example: Learning Module with Training Data Tracking
 * Shows how to track module start/completion and time spent
 */

import { useState, useEffect } from 'react';
import { useTrainingDataTracker } from '../hooks/useTrainingDataTracker';

function ModuleWithTracking({ module, questions }) {
  const [startTime] = useState(Date.now());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const { trackModuleStart, trackModuleComplete, trackClick } = useTrainingDataTracker();

  // Track module start
  useEffect(() => {
    if (module) {
      trackModuleStart(module._id, module.level, module.skill);
    }

    // Track module completion when component unmounts
    return () => {
      if (module) {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        trackModuleComplete(module._id, module.level, module.skill, timeSpent);
      }
    };
  }, [module]);

  const handleNextQuestion = () => {
    trackClick('next_question_button');
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const handlePreviousQuestion = () => {
    trackClick('previous_question_button');
    setCurrentQuestionIndex(prev => prev - 1);
  };

  const handleCompleteModule = () => {
    trackClick('complete_module_button');
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    trackModuleComplete(module._id, module.level, module.skill, timeSpent);
    // Navigate away or mark module as complete
  };

  if (!module) return null;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="module-container">
      <h2>{module.title}</h2>
      <p>{module.description}</p>
      
      <div className="progress">
        Question {currentQuestionIndex + 1} of {questions.length}
      </div>

      <div className="question-content">
        {/* Render current question */}
        {currentQuestion && (
          <div>
            <h3>{currentQuestion.text}</h3>
            {/* Quiz component here */}
          </div>
        )}
      </div>

      <div className="navigation">
        {currentQuestionIndex > 0 && (
          <button onClick={handlePreviousQuestion}>Previous</button>
        )}
        
        {currentQuestionIndex < questions.length - 1 ? (
          <button onClick={handleNextQuestion}>Next</button>
        ) : (
          <button onClick={handleCompleteModule}>Complete Module</button>
        )}
      </div>
    </div>
  );
}

export default ModuleWithTracking;
