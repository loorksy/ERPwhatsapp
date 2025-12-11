export const persistToStorage = (key, value) => {
  if (value === null || value === undefined) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
};

export const loadFromStorage = (key) => {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return raw;
  }
};
