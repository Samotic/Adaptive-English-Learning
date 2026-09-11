/**
 * AI Service using the Google Gemini API (@google/genai SDK).
 * Every method degrades to a helpful fallback when GEMINI_API_KEY is missing or a request fails.
 */
import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

const clip = (value, max) => String(value ?? '').slice(0, max);

class AIService {
  constructor() {
    this.modelName = config.gemini.model;
    this.client = config.gemini.apiKey ? new GoogleGenAI({ apiKey: config.gemini.apiKey }) : null;
    if (!this.client && !config.isTest) {
      console.warn('⚠️  GEMINI_API_KEY not set - AI features will return fallback responses.');
    }
  }

  get disabled() {
    return !this.client;
  }

  /** Returns the generated text, or null when AI is disabled or the request failed. */
  async _generate(prompt) {
    if (!this.client) return null;
    try {
      const response = await this.client.models.generateContent({ model: this.modelName, contents: prompt });
      const text = typeof response?.text === 'string' ? response.text.trim() : '';
      return text || null;
    } catch (err) {
      console.error(`[AI] Request to ${this.modelName} failed:`, err?.message || err);
      return null;
    }
  }

  // 1. Personalized feedback
  async generateFeedback(question, userAnswer, correctAnswer, isCorrect) {
    const fallback = isCorrect ? 'Great job! Keep going!' : 'Good try! Review the rule and try again.';
    const text = await this._generate(`
You are a friendly English learning assistant.

Question: "${clip(question, 1000)}"
Student Answer: "${clip(userAnswer, 2000)}"
Correct Answer: "${clip(correctAnswer, 1000)}"
Result: ${isCorrect ? 'Correct' : 'Incorrect'}

Give 2-3 short, encouraging sentences.
If incorrect, explain why and give a helpful tip.
`);
    return text || fallback;
  }

  // 2. Explain grammar / vocabulary concept
  async explainConcept(concept, userLevel = 'intermediate') {
    if (this.disabled) return 'AI explanations are unavailable because GEMINI_API_KEY is not configured.';
    const text = await this._generate(`
You are an English teacher.

Explain "${clip(concept, 500)}" to a ${clip(userLevel, 30)} student.

Include:
1. Short explanation (2-3 sentences)
2. Two example sentences
3. One easy tip to remember
`);
    return text || 'Explanation unavailable. Please try again later.';
  }

  // 3. Adaptive question generator (JSON)
  async generateQuestion(topic, difficulty = 'intermediate', skillType = 'vocabulary') {
    const fallback = {
      text: `Choose the correct option about ${clip(topic, 100)}`,
      answer: 'example',
      difficulty: 1,
      options: ['example', 'sample', 'test', 'try'],
      explanation: this.disabled
        ? 'AI question generation is unavailable because GEMINI_API_KEY is not configured.'
        : 'Fallback question used.'
    };
    const difficultyMap = { beginner: 0, intermediate: 1, advanced: 2 };

    const raw = await this._generate(`
You are an English exam generator.

Create ONE ${clip(difficulty, 30)} ${clip(skillType, 30)} question about "${clip(topic, 200)}".

Return ONLY valid JSON. No markdown. No text outside JSON.

{
  "text": "",
  "answer": "",
  "difficulty": ${difficultyMap[difficulty] ?? 1},
  "options": ["", "", "", ""],
  "explanation": ""
}
`);
    if (!raw) return fallback;

    try {
      const json = raw.match(/\{[\s\S]*\}/);
      const parsed = json ? JSON.parse(json[0]) : null;
      if (!parsed?.text || !parsed?.answer) return fallback;
      return parsed;
    } catch {
      return fallback;
    }
  }

  // 4. Learning pattern analysis
  async analyzeLearningPattern(responses, userTheta) {
    if (this.disabled) return 'AI analysis is unavailable because GEMINI_API_KEY is not configured.';
    const correct = responses.filter((r) => r.correct).length;
    const total = responses.length;
    const accuracy = total ? ((correct / total) * 100).toFixed(1) : 0;
    const theta = Number.isFinite(userTheta) ? userTheta : 0;

    const text = await this._generate(`
You are an English learning coach.

Stats:
- Questions: ${total}
- Correct: ${correct}
- Accuracy: ${accuracy}%
- Theta: ${theta.toFixed(2)}

Provide:
1. Short assessment (2 sentences)
2. Two improvement tips
3. One motivational sentence
`);
    return text || 'Keep practicing regularly. You are making progress!';
  }

  // 5. Conversation scenario generator
  async generateConversation(topic, level = 'intermediate') {
    if (this.disabled) return 'AI conversations are unavailable because GEMINI_API_KEY is not configured.';
    const text = await this._generate(`
Create an English conversation for ${clip(level, 30)} learners about "${clip(topic, 200)}".

Include:
- Setting (1 sentence)
- Dialogue (4-6 turns)
- 3 vocabulary words
- 1 grammar point highlighted
`);
    return text || 'Conversation generation failed. Please try again later.';
  }

  // 6. Writing correction assistant
  async correctWriting(text, focusArea = 'general') {
    if (this.disabled) return 'AI writing review is unavailable because GEMINI_API_KEY is not configured.';
    const result = await this._generate(`
You are an English writing tutor.

Correct this text focusing on ${clip(focusArea, 50)}:

"${clip(text, 5000)}"

Return:
1. Corrected version
2. Main issues
3. One improvement suggestion
`);
    return result || 'Writing review unavailable. Please try again later.';
  }
}

export default new AIService();
