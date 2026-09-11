import axios from "axios";

// Empty in development: Vite proxies /api to the server (see vite.config.js).
// Set VITE_API_URL (e.g. https://api.example.com) when the API is hosted on another origin.
export const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const API = axios.create({ baseURL: `${API_BASE}/api` });

export function getStoredToken() {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function redirectToLogin() {
  clearSession();
  if (window.location.pathname !== "/login") window.location.assign("/login");
}

const PUBLIC_ENDPOINTS = ["/login", "/register", "/auth/", "/verify-email"];

API.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired or invalid session sends the user back to the login page
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    if (error.response?.status === 401 && getStoredToken() && !PUBLIC_ENDPOINTS.some((p) => url.startsWith(p))) {
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);

/** fetch() with the API base URL, the stored token and expired-session handling. */
export async function apiFetch(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    ...(typeof options.body === "string" ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (response.status === 401 && token) redirectToLogin();
  return response;
}

const withAuth = (token, config = {}) =>
  token ? { ...config, headers: { ...config.headers, Authorization: `Bearer ${token}` } } : config;
const data = (request) => request.then((r) => r.data);

/* ================= AUTH ================= */

export const register = (username, password, email) =>
  data(API.post("/register", { username, password, ...(email ? { email } : {}) }));

export const login = (username, password) => data(API.post("/login", { username, password }));

export const getAuthConfig = () => data(API.get("/auth/config"));

// Google Identity Services ID token ("credential")
export const loginWithGoogle = (credential) => data(API.post("/auth/google", { credential }));

export const verifyEmail = (token) => data(API.post("/verify-email", { token }));

/* ================= ASSESSMENT ================= */

export const getNextQuestion = (token, languageCode = "en") =>
  data(API.get("/next-question", withAuth(token, { params: { languageCode } })));

// The server decides whether the answer is correct
export const submit = (token, questionId, userAnswer, isNLP = false) =>
  data(API.post("/submit", { questionId, userAnswer, isNLP }, withAuth(token)));

export const evaluateSpeech = (token, questionId, transcript) =>
  data(API.post("/evaluate-speech", { questionId, transcript }, withAuth(token)));

// Preview free-text grading without recording an answer
export const evaluateResponse = (token, text, questionId = null) =>
  data(API.post("/evaluate-response", { text, questionId }, withAuth(token)));

/* ================= LEARNING PATH ================= */

export const getLearningPath = (token, languageCode = "en") =>
  data(API.get("/learning-path", withAuth(token, { params: { languageCode } })));

export const getModules = (token) => data(API.get("/modules", withAuth(token)));

export const getModule = (token, id, languageCode = "en") =>
  data(API.get(`/module/${id}`, withAuth(token, { params: { languageCode } })));

export const createModule = (token, moduleData) => data(API.post("/module", moduleData, withAuth(token)));

export const generateInitialPath = (token, externalScores, targetSkills) =>
  data(API.post("/path/generate", { externalScores, targetSkills }, withAuth(token)));

export const checkNeedsGeneration = (token) => data(API.get("/path/needs-generation", withAuth(token)));

/* ================= LESSONS (LOCALIZATION) ================= */

export const getLessonContent = (lessonId, languageCode = "en") =>
  data(API.get(`/lessons/${lessonId}/content`, { params: { languageCode } }));

export const createLesson = (lessonData) => data(API.post("/lessons", lessonData));

export const addLessonTranslation = (lessonId, translation) =>
  data(API.post(`/lessons/${lessonId}/translations`, translation));

/* ================= OFFLINE PROGRESS SYNC ================= */

// entries: [{ questionId, userAnswer, mode, answeredAt }]
export const syncProgress = (token, entries) =>
  data(API.post("/progress/sync", { entries }, withAuth(token)));

/* ================= TEACHER REVIEW & REPORTS ================= */

export const getPendingReviews = (token) => data(API.get("/reviews/pending", withAuth(token)));

export const reviewResponse = (token, responseId, { correct, grade, feedback }) =>
  data(API.post(`/reviews/${responseId}`, { correct, grade, feedback }, withAuth(token)));

export const getClassReport = (token) => data(API.get("/reports/class", withAuth(token)));

export const downloadClassReportPDF = (token) =>
  data(API.get("/reports/class/pdf", withAuth(token, { responseType: "blob" })));

/* ================= NOTIFICATIONS ================= */

export const getUnreadNotifications = (token) => data(API.get("/notifications/unread", withAuth(token)));

export const getAllNotifications = (token) => data(API.get("/notifications", withAuth(token)));

export const markNotificationAsRead = (token, notificationId) =>
  data(API.post(`/notifications/${notificationId}/read`, null, withAuth(token)));

export const markAllNotificationsAsRead = (token) =>
  data(API.post("/notifications/mark-all-read", null, withAuth(token)));

export const getNotificationPreferences = (token) =>
  data(API.get("/notifications/preferences", withAuth(token)));

export const updateNotificationPreferences = (token, preferences) =>
  data(API.put("/notifications/preferences", preferences, withAuth(token)));

/* ================= SUPPORT TICKETS ================= */

export const createSupportTicket = (token, subject, message, priority = "normal") =>
  data(API.post("/support/tickets", { subject, message, priority }, withAuth(token)));

export const getSupportTickets = (token) => data(API.get("/support/tickets", withAuth(token)));

export const resolveSupportTicket = (token, ticketId) =>
  data(API.patch(`/support/tickets/${ticketId}`, { status: "resolved" }, withAuth(token)));

/* ================= AI FEATURES ================= */

export const getAIExplanation = (token, concept, level = "intermediate") =>
  data(API.post("/ai/explain", { concept, level }, withAuth(token)));

export const generateAIQuestion = (token, topic, difficulty = "intermediate", skillType = "vocabulary") =>
  data(API.post("/ai/generate-question", { topic, difficulty, skillType }, withAuth(token)));

export const getAIAnalysis = (token) => data(API.get("/ai/analyze-progress", withAuth(token)));

export const generateConversation = (token, topic, level = "intermediate") =>
  data(API.post("/ai/conversation", { topic, level }, withAuth(token)));

export const correctWriting = (token, text, focusArea = "general") =>
  data(API.post("/ai/correct-writing", { text, focusArea }, withAuth(token)));
