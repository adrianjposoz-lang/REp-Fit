const STORAGE_KEY = 'rep_fit:foodSearch';

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getFoodSearchConfig() {
  const cfg = read();
  return {
    usdaKey: cfg.usdaKey || '',
    offEnabled: cfg.offEnabled !== false,
  };
}

export function saveFoodSearchConfig(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

export function getUSDAKey() {
  const user = read().usdaKey;
  if (user) return user.trim();
  const envKey = import.meta.env?.VITE_USDA_KEY;
  if (envKey) return envKey;
  return 'DEMO_KEY';
}

export function isOFFEnabled() {
  return read().offEnabled !== false;
}
