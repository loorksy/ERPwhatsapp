const getStorage = (persistent) => (persistent ? localStorage : sessionStorage);

export const persistToStorage = (key, value, options = {}) => {
  const { persistent = true } = options;
  const targetStorage = getStorage(persistent);
  const fallbackStorage = getStorage(!persistent);

  if (value === null || value === undefined) {
    // Remove from both to avoid stale data
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
    return;
  }

  targetStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  // Ensure the opposite store does not keep stale auth records
  fallbackStorage.removeItem(key);
};

export const loadFromStorage = (key, options = {}) => {
  const { persistent = true, fallback = true } = options;
  const primaryStorage = getStorage(persistent);
  const secondaryStorage = getStorage(!persistent);

  const rawPrimary = primaryStorage.getItem(key);
  const rawSecondary = fallback ? secondaryStorage.getItem(key) : null;
  const raw = rawPrimary ?? rawSecondary;
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    return raw;
  }
};
