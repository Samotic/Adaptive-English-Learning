const STORAGE_KEY = "offline_lessons";

// Save a module/lesson offline keyed by (id + languageCode)
export function saveLessonOffline(id, languageCode = "en", data = null) {
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  const key = `${id}:${languageCode}`;

  existing[key] = {
    id,
    languageCode,
    savedAt: new Date().toISOString(),
    data // optional payload (you can store fetched content here later)
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return existing[key];
}

export function getOfflineLesson(id, languageCode = "en") {
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  const key = `${id}:${languageCode}`;
  return existing[key] || null;
}

export function getAllOfflineLessons() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
}
