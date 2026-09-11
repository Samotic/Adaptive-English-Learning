const KEY = "locale";

export function getLocale() {
  return localStorage.getItem(KEY) || "en";
}

export function setLocale(locale) {
  localStorage.setItem(KEY, locale);
}
