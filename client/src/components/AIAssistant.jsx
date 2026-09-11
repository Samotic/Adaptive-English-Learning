import React, { useState } from "react";
import {
  getAIExplanation,
  generateAIQuestion,
  generateConversation,
  correctWriting,
} from "../api";

export default function AIAssistant({ token }) {
  const [activeTab, setActiveTab] = useState("explain");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Explain tab
  const [concept, setConcept] = useState("");
  const [level, setLevel] = useState("intermediate");

  // Generate question tab
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [skillType, setSkillType] = useState("vocabulary");

  // Conversation tab
  const [convTopic, setConvTopic] = useState("");
  const [convLevel, setConvLevel] = useState("intermediate");

  // Writing tab
  const [writingText, setWritingText] = useState("");
  const [focusArea, setFocusArea] = useState("general");

  const handleExplain = async (e) => {
    e.preventDefault();
    if (!concept.trim()) return;

    setLoading(true);
    setResult(null);
    try {
      const data = await getAIExplanation(token, concept, level);
      setResult({ type: "explanation", data });
    } catch (error) {
      setResult({
        type: "error",
        data: error.response?.data?.error || "Failed to get explanation",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuestion = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setResult(null);
    try {
      const data = await generateAIQuestion(
        token,
        topic,
        difficulty,
        skillType
      );
      setResult({ type: "question", data });
    } catch (error) {
      setResult({
        type: "error",
        data: error.response?.data?.error || "Failed to generate question",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateConversation = async (e) => {
    e.preventDefault();
    if (!convTopic.trim()) return;

    setLoading(true);
    setResult(null);
    try {
      const data = await generateConversation(token, convTopic, convLevel);
      setResult({ type: "conversation", data });
    } catch (error) {
      setResult({
        type: "error",
        data: error.response?.data?.error || "Failed to generate conversation",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCorrectWriting = async (e) => {
    e.preventDefault();
    if (!writingText.trim()) return;

    setLoading(true);
    setResult(null);
    try {
      const data = await correctWriting(token, writingText, focusArea);
      setResult({ type: "correction", data });
    } catch (error) {
      setResult({
        type: "error",
        data: error.response?.data?.error || "Failed to correct writing",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="ai-assistant"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "12px",
        padding: "24px",
        marginTop: "24px",
        color: "white",
      }}
    >
      <h2 style={{ marginBottom: "20px", textAlign: "center" }}>
        🤖 AI Learning Assistant
      </h2>

      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setActiveTab("explain")}
          style={{
            padding: "10px 20px",
            background:
              activeTab === "explain" ? "white" : "rgba(255,255,255,0.2)",
            color: activeTab === "explain" ? "#667eea" : "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Explain Concept
        </button>
        <button
          onClick={() => setActiveTab("question")}
          style={{
            padding: "10px 20px",
            background:
              activeTab === "question" ? "white" : "rgba(255,255,255,0.2)",
            color: activeTab === "question" ? "#667eea" : "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Generate Question
        </button>
        <button
          onClick={() => setActiveTab("conversation")}
          style={{
            padding: "10px 20px",
            background:
              activeTab === "conversation" ? "white" : "rgba(255,255,255,0.2)",
            color: activeTab === "conversation" ? "#667eea" : "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Conversation Practice
        </button>
        <button
          onClick={() => setActiveTab("writing")}
          style={{
            padding: "10px 20px",
            background:
              activeTab === "writing" ? "white" : "rgba(255,255,255,0.2)",
            color: activeTab === "writing" ? "#667eea" : "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Writing Help
        </button>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: "8px",
          padding: "20px",
          color: "#333",
        }}
      >
        {activeTab === "explain" && (
          <form onSubmit={handleExplain}>
            <h3 style={{ marginTop: 0 }}>Get AI Explanation</h3>
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="e.g., past perfect tense, phrasal verbs..."
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "4px",
                border: "1px solid #ddd",
              }}
            />
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "4px",
                border: "1px solid #ddd",
              }}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "bold",
              }}
            >
              {loading ? "Getting explanation..." : "Explain"}
            </button>
          </form>
        )}

        {activeTab === "question" && (
          <form onSubmit={handleGenerateQuestion}>
            <h3 style={{ marginTop: 0 }}>Generate Practice Question</h3>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic (e.g., travel, business, daily life)"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "4px",
                border: "1px solid #ddd",
              }}
            />
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "4px",
                border: "1px solid #ddd",
              }}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <select
              value={skillType}
              onChange={(e) => setSkillType(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "4px",
                border: "1px solid #ddd",
              }}
            >
              <option value="vocabulary">Vocabulary</option>
              <option value="grammar">Grammar</option>
              <option value="reading">Reading</option>
              <option value="listening">Listening</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "bold",
              }}
            >
              {loading ? "Generating..." : "Generate Question"}
            </button>
          </form>
        )}

        {activeTab === "conversation" && (
          <form onSubmit={handleGenerateConversation}>
            <h3 style={{ marginTop: 0 }}>Conversation Practice</h3>
            <input
              type="text"
              value={convTopic}
              onChange={(e) => setConvTopic(e.target.value)}
              placeholder="Topic (e.g., at a restaurant, job interview)"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "4px",
                border: "1px solid #ddd",
              }}
            />
            <select
              value={convLevel}
              onChange={(e) => setConvLevel(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "4px",
                border: "1px solid #ddd",
              }}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "bold",
              }}
            >
              {loading ? "Creating conversation..." : "Generate"}
            </button>
          </form>
        )}

        {activeTab === "writing" && (
          <form onSubmit={handleCorrectWriting}>
            <h3 style={{ marginTop: 0 }}>Writing Correction</h3>
            <textarea
              value={writingText}
              onChange={(e) => setWritingText(e.target.value)}
              placeholder="Enter your text here..."
              rows="6"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                resize: "vertical",
              }}
            />
            <select
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "4px",
                border: "1px solid #ddd",
              }}
            >
              <option value="general">General</option>
              <option value="grammar">Grammar</option>
              <option value="vocabulary">Vocabulary</option>
              <option value="style">Style & Flow</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "bold",
              }}
            >
              {loading ? "Analyzing..." : "Check Writing"}
            </button>
          </form>
        )}

        {result && (
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              background: result.type === "error" ? "#fee" : "#f0f9ff",
              borderRadius: "6px",
              border: `1px solid ${
                result.type === "error" ? "#fcc" : "#bae6fd"
              }`,
            }}
          >
            {result.type === "error" && (
              <p style={{ color: "#dc2626", margin: 0 }}>{result.data}</p>
            )}
            {result.type === "explanation" && (
              <div>
                <h4 style={{ marginTop: 0 }}>Explanation:</h4>
                <p style={{ whiteSpace: "pre-wrap" }}>
                  {typeof result.data === "string"
                    ? result.data
                    : result.data.explanation}
                </p>
              </div>
            )}
            {result.type === "question" && (
              <div>
                <h4 style={{ marginTop: 0 }}>Generated Question:</h4>
                <p>
                  <strong>Q:</strong> {result.data.text}
                </p>
                <p>
                  <strong>Answer:</strong> {result.data.answer}
                </p>
                {typeof result.data === "string"
                  ? result.data
                  : result.data.explanation}{" "}
                <p>
                  <strong>Explanation:</strong>{" "}
                  {typeof result.data === "string"
                    ? result.data
                    : result.data.explanation}
                </p>
              </div>
            )}
            {result.type === "conversation" && (
              <div>
                <h4 style={{ marginTop: 0 }}>Conversation Practice:</h4>
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {result.data.conversation}
                </div>
              </div>
            )}
            {result.type === "correction" && (
              <div>
                <h4 style={{ marginTop: 0 }}>Writing Feedback:</h4>
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {typeof result.data === "string"
                    ? result.data
                    : result.data.correction}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
