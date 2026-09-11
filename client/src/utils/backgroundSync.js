import { syncProgress, getStoredToken } from "../api";

const QUEUE_KEY = "offlineProgress";
const MAX_QUEUED = 100;
let isSyncing = false;

function readQueue() {
  try {
    const parsed = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function writeQueue(entries) {
  if (entries.length) localStorage.setItem(QUEUE_KEY, JSON.stringify(entries));
  else localStorage.removeItem(QUEUE_KEY);
}

/** Stores an answer that could not be submitted; it is graded by the server once back online. */
export function queueOfflineAnswer({ questionId, userAnswer, mode }) {
  const entries = readQueue();
  entries.push({ questionId, userAnswer, mode, answeredAt: new Date().toISOString() });
  writeQueue(entries.slice(-MAX_QUEUED));
}

export function getQueuedAnswerCount() {
  return readQueue().length;
}

export async function syncOfflineProgress(token = getStoredToken()) {
  if (isSyncing || !token || !navigator.onLine) return;
  const entries = readQueue();
  if (!entries.length) return;

  isSyncing = true;
  try {
    const result = await syncProgress(token, entries);
    // Entries the server rejected (e.g. a deleted question) cannot succeed later, so the queue is cleared
    writeQueue([]);
    console.log(`✅ Synced ${result.synced} of ${entries.length} offline answer(s).`);
  } catch (err) {
    // Network and server errors keep the queue for the next attempt
    console.error("❌ Failed to sync offline progress:", err.message);
  } finally {
    isSyncing = false;
  }
}

export function initBackgroundSync(token) {
  const handler = () => syncOfflineProgress(token);
  window.addEventListener("online", handler);
  handler();
  return () => window.removeEventListener("online", handler);
}
