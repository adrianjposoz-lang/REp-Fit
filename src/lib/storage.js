const LOGS_KEY = 'daily_logs';
const RECENT_KEY = 'recent_foods';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function getAllLogs() {
  return read(LOGS_KEY, {});
}

export function saveAllLogs(logs) {
  write(LOGS_KEY, logs);
}

export function getDay(date) {
  const logs = getAllLogs();
  return logs[date] || { steps: 0, weight: null, foods: [] };
}

export function saveDay(date, patch) {
  const logs = getAllLogs();
  const existing = logs[date] || { steps: 0, weight: null, foods: [] };
  logs[date] = { ...existing, ...patch };
  saveAllLogs(logs);
  return logs[date];
}

export function addFood(date, food) {
  const logs = getAllLogs();
  const existing = logs[date] || { steps: 0, weight: null, foods: [] };
  existing.foods = [...(existing.foods || []), food];
  logs[date] = existing;
  saveAllLogs(logs);
  return logs[date];
}

export function removeFood(date, foodId) {
  const logs = getAllLogs();
  const existing = logs[date];
  if (!existing) return null;
  existing.foods = (existing.foods || []).filter((f) => f.id !== foodId);
  logs[date] = existing;
  saveAllLogs(logs);
  return existing;
}

export function setSteps(date, steps) {
  return saveDay(date, { steps: Number(steps) || 0 });
}

export function setWeight(date, weight) {
  const w = weight === '' || weight === null ? null : Number(weight);
  return saveDay(date, { weight: w });
}

export function getRecentFoods() {
  return read(RECENT_KEY, []);
}

export function addRecentFood(food) {
  let recent = getRecentFoods();
  recent = recent.filter((r) => r.fdcId !== food.fdcId);
  recent.unshift(food);
  recent = recent.slice(0, 10);
  write(RECENT_KEY, recent);
  return recent;
}
