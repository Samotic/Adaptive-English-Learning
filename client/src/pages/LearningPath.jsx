import React, { useState, useEffect } from "react";
import {
  getLearningPath,
  getModule,
  submit,
  evaluateSpeech,
  evaluateResponse,
  getAIExplanation,
  generateAIQuestion,
} from "../api";
import VoiceInput from "../components/VoiceInput";
import AIAssistant from "../components/AIAssistant";
import { queueOfflineAnswer } from "../utils/backgroundSync";

const LEVEL_LABELS = ["Beginner", "Elementary", "Intermediate", "Upper-Intermediate", "Advanced"];

export default function LearningPath({ token }) {
  const [path, setPath] = useState(null);
  const [activeModule, setActiveModule] = useState(null);
  const [moduleContent, setModuleContent] = useState(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [answers, setAnswers] = useState({}); // Per-question answer state
  const [feedback, setFeedback] = useState({}); // Changed to object to track per question
  const [aiExplanation, setAiExplanation] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [voiceAnswers, setVoiceAnswers] = useState({}); // Per-question voice answers
  const [aiQuestionFeedback, setAiQuestionFeedback] = useState(null);


  useEffect(() => {
    loadPath();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPath() {
    setLoading(true);
    setError("");
    try {
      const data = await getLearningPath(token);
      console.log("Learning path loaded:", data);
      setPath(data);
    } catch (e) {
      console.error("Failed to load learning path:", e);
      setError("Failed to load learning path. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function openModule(m) {
    setActiveModule(m);
    setActiveQuestion(null);
    setFeedback({}); // Reset feedback for new module
    setAiExplanation(null);
    setLoading(true);
    setError("");
    try {
      console.log("Opening module:", m);
      const mod = await getModule(token, m.id);
      console.log("Module content loaded:", mod);
      if (mod.items && mod.items[0]) {
        console.log("First item:", mod.items[0]);
        console.log("First question:", mod.items[0].question);
        if (mod.items[0].question) {
          console.log("  - audioUrl:", mod.items[0].question.audioUrl);
          console.log("  - type:", mod.items[0].question.type);
          console.log("  - text:", mod.items[0].question.text?.substring(0, 60));
        }
      }
      console.log(`\n📦 TOTAL ITEMS IN MODULE: ${mod.items?.length}`);
      mod.items?.forEach((item, idx) => {
        console.log(`   ${idx + 1}. Type: ${item.question?.type}, HasAudio: ${!!item.question?.audioUrl}, Text: ${item.question?.text?.substring(0, 50)}`);
      });
      setModuleContent(mod);
    } catch (e) {
      console.error("Failed to load module:", e);
      setError("Failed to open module.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnswerSubmit(e, item) {
    e.preventDefault();
    if (!item.question) return;

    const question = item.question;
    const questionId = question._id || item.id;
    const isSpeaking =
      question.skill === "speaking" || item.type === "speaking";

    // Use per-question answer state
    const userAnswer = isSpeaking
      ? (voiceAnswers[questionId] || "").trim()
      : (answers[questionId] || "").trim();

    if (!userAnswer) {
      setFeedback((prev) => ({
        ...prev,
        [questionId]: { correct: false, message: "⚠️ Please enter an answer." },
      }));
      return;
    }

    setEvaluating(true);

    try {
      const isFreeText =
        question.type === "free-text" || question.evaluationType === "semantic";

      // Answers are graded on the server (objective, free-text and speech)
      if (isSpeaking) {
        const result = await evaluateSpeech(token, question._id, userAnswer);
        const speechEval = result.speechEvaluation;

        setFeedback((prev) => ({
          ...prev,
          [questionId]: {
            correct: result.correct,
            message: result.correct
              ? `✅ Excellent speaking! Score: ${speechEval.grade}%\n${speechEval.feedback}`
              : `📝 Score: ${speechEval.grade}%\n${speechEval.feedback}`,
            speechScore: speechEval.grade,
            speechMetrics: {
              fluency: speechEval.fluency,
              vocabulary: speechEval.vocabulary,
              coherence: speechEval.coherence,
              wordCount: speechEval.wordCount,
              sentenceCount: speechEval.sentenceCount,
            },
          },
        }));

        setVoiceAnswers((prev) => ({ ...prev, [questionId]: "" }));
        setAnswers((prev) => ({ ...prev, [questionId]: "" }));
      } else if (isFreeText) {
        const result = await submit(token, question._id, userAnswer, true);
        const nlpResult = result.nlpEvaluation;
        const needsReview = result.reviewStatus === "pending_review";
        const expected = result.correctAnswer ? `\nExpected answer: "${result.correctAnswer}"` : "";

        setFeedback((prev) => ({
          ...prev,
          [questionId]: {
            correct: result.correct,
            message: needsReview
              ? `⏳ ${nlpResult?.feedback}`
              : result.correct
              ? `✅ Great work! Score: ${nlpResult?.grade}% - ${nlpResult?.feedback}`
              : `📝 Score: ${nlpResult?.grade}% - ${nlpResult?.feedback}${expected}`,
            nlpScore: needsReview ? undefined : nlpResult?.grade,
            nlpConfidence: nlpResult?.confidence,
            needsReview,
            aiFeedback: result.aiFeedback,
          },
        }));

        setAnswers((prev) => ({ ...prev, [questionId]: "" }));
      } else {
        const result = await submit(token, question._id, userAnswer);

        setFeedback((prev) => ({
          ...prev,
          [questionId]: {
            correct: result.correct,
            message: result.correct
              ? "✅ Correct! Great job!"
              : `❌ Incorrect. The correct answer is: "${result.correctAnswer}"`,
            aiFeedback: result.aiFeedback,
          },
        }));

        // Get AI explanation after answering incorrectly
        if (!result.correct) {
          getAIHelp(question.text);
        }

        setAnswers((prev) => ({ ...prev, [questionId]: "" }));
      }

      // Reload learning path to get updated theta and recommendations
      setTimeout(() => loadPath(), 1000);
    } catch (e) {
      // No response means the request never reached the server: keep the answer and sync it later
      if (!e.response) {
        const freeText = question.type === "free-text" || question.evaluationType === "semantic";
        queueOfflineAnswer({
          questionId: question._id,
          userAnswer,
          mode: isSpeaking ? "speech" : freeText ? "free-text" : undefined,
        });
        setFeedback((prev) => ({
          ...prev,
          [questionId]: {
            correct: false,
            needsReview: true,
            message: "📴 You appear to be offline. Your answer was saved and will be submitted automatically when you reconnect.",
          },
        }));
        setAnswers((prev) => ({ ...prev, [questionId]: "" }));
        setVoiceAnswers((prev) => ({ ...prev, [questionId]: "" }));
        return;
      }

      console.error("Submit error:", e);
      setFeedback((prev) => ({
        ...prev,
        [questionId]: {
          correct: false,
          message: `❌ ${e.response.data?.error || "Failed to submit answer. Please try again."}`,
        },
      }));
    } finally {
      setEvaluating(false);
    }
  }

  async function getAIHelp(concept) {
    setLoadingAI(true);
    setAiExplanation(null);
    try {
      const result = await getAIExplanation(token, concept, "intermediate");
      setAiExplanation(result.explanation);
    } catch (e) {
      console.error("AI explanation error:", e);
      setAiExplanation("AI explanation not available at this time.");
    } finally {
      setLoadingAI(false);
    }
  }

  async function generatePracticeQuestion(skill, difficulty) {
    setLoadingAI(true);
    try {
      const result = await generateAIQuestion(token, skill, difficulty, skill);
      setActiveQuestion({
        text: result.text,
        answer: result.answer,
        options: result.options,
        explanation: result.explanation,
        isAIGenerated: true,
      });
    } catch (e) {
      console.error("AI question generation error:", e);
      setError("Failed to generate AI question.");
    } finally {
      setLoadingAI(false);
    }
  }

  if (loading && !path) {
    return (
      <div className="learning-path-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your personalized learning path...</p>
        </div>
      </div>
    );
  }

  if (error && !path) {
    return (
      <div className="learning-path-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadPath} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!path) {
    return (
      <div className="learning-path-container">
        <div className="empty-state">
          <h3>No Learning Path Available</h3>
          <p>
            Complete the initial assessment to generate your personalized
            learning path.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="learning-path-container">
      <div className="learning-path-header">
        <h2>🎯 Your AI-Powered Learning Path</h2>
        <div className="path-stats">
          <div className="stat-item">
            <span className="stat-label">Your Level</span>
            <span className="stat-value">
              {LEVEL_LABELS[path.suggestedLevel] ?? "Beginner"}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Ability Score (θ)</span>
            <span className="stat-value">
              {path.theta?.toFixed(2) || "0.00"}
            </span>
          </div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {!activeModule ? (
        <div className="modules-grid">
          <h3 className="section-title">Recommended Modules</h3>
          <div className="modules-list">
            {path.modules && path.modules.length > 0 ? (
              path.modules.map((m) => (
                <div key={m.id} className="module-card">
                  <div className="module-header">
                    <h4>{m.title}</h4>
                    <span className="module-skill">{m.skill}</span>
                  </div>
                  <p className="module-level">Level {m.level}</p>
                  <button
                    onClick={() => openModule(m)}
                    className="btn-open-module"
                  >
                    Start Module →
                  </button>
                </div>
              ))
            ) : (
              <p className="no-modules">No modules available yet.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="module-content">
          <button
            onClick={() => {
              setActiveModule(null);
              setModuleContent(null);
              setActiveQuestion(null);
              setFeedback({});
              setAiExplanation(null);
            }}
            className="btn-back"
          >
            ← Back to Modules
          </button>

          <div className="module-detail">
            <h3>{moduleContent?.title || activeModule.title}</h3>
            <p className="module-description">
              {moduleContent?.description || ""}
            </p>

            {moduleContent?.items && moduleContent.items.length > 0 ? (
              <div className="questions-list">
                <h4>Practice Questions ({moduleContent.items.length})</h4>
                {(() => {
                  const typeCount = {};
                  const audioCount = {};
                  moduleContent.items.forEach(item => {
                    const q = item.question;
                    if (q) {
                      typeCount[q.type] = (typeCount[q.type] || 0) + 1;
                      if (q.audioUrl) audioCount[q.type] = (audioCount[q.type] || 0) + 1;
                    }
                  });
                  const typeList = Object.entries(typeCount).map(([type, count]) => {
                    const withAudio = audioCount[type] || 0;
                    return `${count} ${type}${withAudio > 0 ? ` (${withAudio} with audio)` : ''}`;
                  }).join(', ');
                  return <p style={{ fontSize: "0.9em", color: "#666", marginBottom: "15px" }}>
                    📊 Contains: {typeList} • 💡 Scroll down to see all questions
                  </p>;
                })()}
                
                {moduleContent.items.map((item, index) => {
                  const question = item.question;
                  if (!question) {
                    return (
                      <div key={item.id || index} className="question-item">
                        <div className="question-header">
                          <span className="question-number">#{index + 1}</span>
                          <span className="question-type">
                            {item.type || "upcoming"}
                          </span>
                        </div>
                        <p className="no-question">
                          ⏳ Question coming soon...
                        </p>
                      </div>
                    );
                  }
                  // Debug logging
                  if (index === 0) {
                    console.log(`[Q${index + 1}] audioUrl:`, question.audioUrl);
                    console.log(`[Q${index + 1}] type:`, question.type);
                    console.log(`[Q${index + 1}] options:`, question.options?.length);
                  }

                  const isFreeText =
                    question.type === "free-text" ||
                    question.evaluationType === "semantic";
                  const isSpeaking =
                    question.skill === "speaking" || item.type === "speaking";

                  return (
                    <div key={item.id || index} className="question-item">
                      <div className="question-header">
                        <span className="question-number">#{index + 1}</span>
                        <span className="question-type">
                          {isSpeaking
                            ? "🎤 Speaking"
                            : isFreeText
                            ? "📝 Free Text"
                            : question.type || "objective"}
                        </span>
                        <span className="question-difficulty">
                          Level:{" "}
                          {question.difficulty >= 1.5
                            ? "Advanced"
                            : question.difficulty >= 0
                            ? "Intermediate"
                            : "Beginner"}
                        </span>
                      </div>

                      <div className="question-content">
                        <p className="question-text">{question.text}</p>

                        {/* Audio Player for Questions with Audio */}
                        {(question.audioUrl || question.audioText) && (
                          <div className="audio-section">
                            <label className="audio-label">🎧 Listen to the audio:</label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                              {question.audioText && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    window.speechSynthesis.cancel();
                                    const utterance = new SpeechSynthesisUtterance(question.audioText);
                                    utterance.rate = 0.8;
                                    utterance.pitch = 1;
                                    utterance.volume = 1;
                                    // Try to use a better English voice if available
                                    const voices = window.speechSynthesis.getVoices();
                                    const englishVoice = voices.find(v => v.lang.startsWith('en'));
                                    if (englishVoice) utterance.voice = englishVoice;
                                    window.speechSynthesis.speak(utterance);
                                  }}
                                  className="btn-text-to-speech"
                                  style={{
                                    padding: '10px 16px',
                                    backgroundColor: '#2196F3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    flex: '1',
                                    minWidth: '150px'
                                  }}
                                  title="Play audio using text-to-speech"
                                >
                                  🔊 Play Audio
                                </button>
                              )}
                            </div>
                            {question.audioText && (
                              <details className="audio-transcript">
                                <summary>📝 Show transcript</summary>
                                <p className="transcript-text">{question.audioText}</p>
                              </details>
                            )}
                          </div>
                        )}

                        {/* Voice Input for Speaking Questions - FR23 */}
                        {isSpeaking && (
                          <div className="learning-path-voice-section">
                            <VoiceInput
                              onTranscriptChange={(transcript) => {
                                setVoiceAnswers((prev) => ({
                                  ...prev,
                                  [item.id || item.question._id]: transcript,
                                }));
                                setAnswers((prev) => ({
                                  ...prev,
                                  [item.id || item.question._id]: transcript,
                                }));
                              }}
                              placeholder="Click the microphone and speak your answer clearly..."
                            />
                          </div>
                        )}

                        {/* Display options for multiple choice */}
                        {!isSpeaking &&
                          question.options &&
                          question.options.length > 0 && (
                            <div>
                              <div className="question-options">
                                {question.options.map((opt, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() =>
                                      setAnswers((prev) => ({
                                        ...prev,
                                        [item.id || question._id]: opt,
                                      }))
                                    }
                                    className={`option-btn ${
                                      answers[item.id || question._id] === opt
                                        ? "selected"
                                        : ""
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                              <form onSubmit={(e) => handleAnswerSubmit(e, item)}>
                                <button
                                  type="submit"
                                  className="btn-submit-answer"
                                  disabled={
                                    evaluating ||
                                    !(answers[item.id || question._id] || "").trim()
                                  }
                                >
                                  {evaluating ? "⏳ Evaluating..." : "Submit Answer"}
                                </button>
                              </form>
                            </div>
                          )}

                        {/* Text Input for Free-Text/Non-Speaking Questions */}
                        {!isSpeaking && (!question.options || question.options.length === 0) && (
                          <form onSubmit={(e) => handleAnswerSubmit(e, item)}>
                            <textarea
                              value={answers[item.id || question._id] || ""}
                              onChange={(e) =>
                                setAnswers((prev) => ({
                                  ...prev,
                                  [item.id || question._id]: e.target.value,
                                }))
                              }
                              placeholder={
                                isFreeText
                                  ? "Write your detailed response here..."
                                  : "Your answer..."
                              }
                              className={
                                isFreeText
                                  ? "question-textarea"
                                  : "question-input"
                              }
                              rows={isFreeText ? 5 : 1}
                              disabled={evaluating}
                            />
                            <button
                              type="submit"
                              className="btn-submit-answer"
                              disabled={
                                evaluating ||
                                !(answers[item.id || question._id] || "").trim()
                              }
                            >
                              {evaluating
                                ? "⏳ Evaluating..."
                                : isFreeText
                                ? "📤 Submit for Evaluation"
                                : "Submit Answer"}
                            </button>
                          </form>
                        )}

                        {/* Submit Button for Speaking Questions */}
                        {isSpeaking && (
                          <form
                            onSubmit={(e) => handleAnswerSubmit(e, item)}
                            className="learning-path-submit-speaking"
                          >
                            <button
                              type="submit"
                              className="btn-submit-answer"
                              disabled={
                                evaluating ||
                                !(
                                  voiceAnswers[item.id || question._id] || ""
                                ).trim()
                              }
                              style={{ width: "100%" }}
                            >
                              {evaluating
                                ? "⏳ Evaluating Speech..."
                                : "🎤 Submit Speaking Response"}
                            </button>
                          </form>
                        )}

                        {feedback[item.id || question._id] && (
                          <div
                            className={`feedback ${
                              feedback[item.id || question._id].correct
                                ? "correct"
                                : feedback[item.id || question._id].needsReview
                                ? "review"
                                : "incorrect"
                            }`}
                          >
                            <div className="feedback-message">
                              {feedback[item.id || question._id].message}
                            </div>

                            {/* Speech Metrics Display */}
                            {feedback[item.id || question._id]
                              .speechMetrics && (
                              <div className="speech-metrics">
                                <h5>📊 Speech Analysis</h5>
                                <div className="metrics-grid">
                                  <div className="metric">
                                    <span className="metric-label">
                                      Fluency:
                                    </span>
                                    <span className="metric-value">
                                      {
                                        feedback[item.id || question._id]
                                          .speechMetrics.fluency
                                      }
                                      %
                                    </span>
                                  </div>
                                  <div className="metric">
                                    <span className="metric-label">
                                      Vocabulary:
                                    </span>
                                    <span className="metric-value">
                                      {
                                        feedback[item.id || question._id]
                                          .speechMetrics.vocabulary
                                      }
                                      %
                                    </span>
                                  </div>
                                  <div className="metric">
                                    <span className="metric-label">
                                      Coherence:
                                    </span>
                                    <span className="metric-value">
                                      {
                                        feedback[item.id || question._id]
                                          .speechMetrics.coherence
                                      }
                                      %
                                    </span>
                                  </div>
                                  <div className="metric">
                                    <span className="metric-label">
                                      Words Spoken:
                                    </span>
                                    <span className="metric-value">
                                      {
                                        feedback[item.id || question._id]
                                          .speechMetrics.wordCount
                                      }
                                    </span>
                                  </div>
                                  <div className="metric">
                                    <span className="metric-label">
                                      Sentences:
                                    </span>
                                    <span className="metric-value">
                                      {
                                        feedback[item.id || question._id]
                                          .speechMetrics.sentenceCount
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* NLP Metrics Display */}
                            {feedback[item.id || question._id].nlpScore !==
                              undefined && (
                              <div className="nlp-details">
                                <div className="nlp-score">
                                  Score:{" "}
                                  {feedback[item.id || question._id].nlpScore}%
                                  {feedback[item.id || question._id]
                                    .nlpConfidence &&
                                    ` (Confidence: ${Math.round(
                                      feedback[item.id || question._id]
                                        .nlpConfidence * 100
                                    )}%)`}
                                </div>
                              </div>
                            )}

                            {feedback[item.id || question._id].aiFeedback && (
                              <div className="ai-feedback-box">
                                <strong>💡 AI Feedback:</strong>
                                <p>
                                  {feedback[item.id || question._id].aiFeedback}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {!feedback[item.id || question._id] && !evaluating && (
                          <button
                            onClick={() => getAIHelp(question.text)}
                            className="btn-ai-help"
                            disabled={loadingAI}
                          >
                            {loadingAI ? "Loading..." : "💡 Get AI Help"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="no-questions">No questions in this module yet.</p>
            )}

            {aiExplanation && (
              <div className="ai-explanation">
                <h4>🤖 AI Explanation</h4>
                <p style={{ whiteSpace: "pre-wrap" }}>{aiExplanation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeQuestion && activeQuestion.isAIGenerated && (
        <div className="ai-generated-question">
          <h4>🤖 AI Generated Practice Question</h4>
          <p className="question-text">{activeQuestion.text}</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!answer.trim()) return;

              setEvaluating(true);
              try {
                // Check if it's a simple answer comparison or needs NLP
                const isLongAnswer = answer.split(/\s+/).length > 10;

                if (isLongAnswer) {
                  // Use NLP evaluation for longer answers
                  const result = await evaluateResponse(token, answer, null);
                  const passed = result.passed;

                  setFeedback({
                    correct: passed,
                    message: passed
                      ? `✅ Excellent! Score: ${result.evaluation.grade}% - ${result.evaluation.feedback}`
                      : `📝 Score: ${result.evaluation.grade}% - ${result.evaluation.feedback}`,
                    nlpScore: result.evaluation.grade,
                  });
                } else {
                  // Simple comparison for short answers
                  const correct =
                    answer.toLowerCase().trim() ===
                    (activeQuestion.answer || "").toLowerCase().trim();
                  setFeedback({
                    correct,
                    message: correct
                      ? "✅ Correct!"
                      : `❌ The answer is: ${activeQuestion.answer}`,
                  });
                }
              } catch (err) {
                setFeedback({
                  correct: false,
                  message: "❌ Error evaluating answer",
                });
              } finally {
                setEvaluating(false);
              }
              setAnswer("");
            }}
          >
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Your answer..."
              className="question-input"
              rows={3}
              disabled={evaluating}
            />
            <button
              type="submit"
              className="btn-submit-answer"
              disabled={evaluating || !answer.trim()}
            >
              {evaluating ? "⏳ Evaluating..." : "Submit"}
            </button>
          </form>
          {feedback && (
            <div
              className={`feedback ${
                feedback.correct ? "correct" : "incorrect"
              }`}
            >
              {feedback.message}
            </div>
          )}
          <button
            onClick={() => {
              setActiveQuestion(null);
              setFeedback({});
              setAnswer("");
            }}
            className="btn-close"
          >
            Close
          </button>
        </div>
      )}

      <style>{`
        .audio-section {
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
          border-radius: 6px;
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
          cursor: pointer;
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
      `}</style>

      {/* AI Assistant Section */}
      <div className="ai-assistant-section">
        <h2 style={{ marginTop: "40px", marginBottom: "20px", borderTop: "2px solid #667eea", paddingTop: "20px" }}>
          🤖 AI Assistant
        </h2>
        <AIAssistant token={token} />
      </div>
    </div>
  );
}
