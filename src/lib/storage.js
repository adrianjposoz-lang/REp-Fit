import { ADRIAN_DEFAULTS, BLANK_DAY, MEAL_KEYS } from './constants.js';

const KEYS = {
  CONFIG: 'rep_fit:config',
  PROFILE: (id) => `rep_fit:profile:${id}`,
  UNLOCK: 'rep_fit:unlock_until',
  LEGACY_LOGS: 'daily_logs',
  LEGACY_RECENT: 'recent_foods',
};

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
  } catch {}
}

function del(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

// ---------- Config ----------

export function getConfig() {
  return read(KEYS.CONFIG, null);
}

export function saveConfig(cfg) {
  write(KEYS.CONFIG, cfg);
}

export function hasConfig() {
  return !!getConfig();
}

export function setCurrentProfile(id) {
  const cfg = getConfig();
  if (!cfg) return;
  cfg.currentProfile = id;
  saveConfig(cfg);
}

// ---------- Profiles ----------

function blankProfile(name, defaults = {}) {
  return {
    name,
    settings: { ...ADRIAN_DEFAULTS, name, ...defaults },
    logs: {},
    favorites: [],
    recent: [],
    customFoods: [],
  };
}

export function createProfile(id, name, defaults = {}) {
  const cfg = getConfig() || {
    profiles: [],
    currentProfile: null,
    createdAt: Date.now(),
    version: 2,
  };
  if (!cfg.profiles.includes(id)) cfg.profiles.push(id);
  if (!cfg.currentProfile) cfg.currentProfile = id;
  saveConfig(cfg);
  if (!read(KEYS.PROFILE(id), null)) {
    write(KEYS.PROFILE(id), blankProfile(name, defaults));
  }
}

export function deleteProfile(id) {
  const cfg = getConfig();
  if (!cfg) return;
  cfg.profiles = cfg.profiles.filter((p) => p !== id);
  if (cfg.currentProfile === id) {
    cfg.currentProfile = cfg.profiles[0] || null;
  }
  saveConfig(cfg);
  del(KEYS.PROFILE(id));
}

export function getProfile(id) {
  const cfg = getConfig();
  const pid = id || cfg?.currentProfile;
  if (!pid) return null;
  return read(KEYS.PROFILE(pid), null);
}

export function saveProfile(id, profile) {
  const cfg = getConfig();
  const pid = id || cfg?.currentProfile;
  if (!pid) return;
  write(KEYS.PROFILE(pid), profile);
}

export function patchSettings(patch) {
  const id = getConfig()?.currentProfile;
  const p = getProfile(id);
  if (!p) return;
  p.settings = { ...p.settings, ...patch };
  saveProfile(id, p);
  return p;
}

// ---------- Day-level helpers (current profile) ----------

export function getDay(date) {
  const p = getProfile();
  if (!p) return BLANK_DAY();
  const day = p.logs[date];
  if (!day) return BLANK_DAY();
  const meals = day.meals || {};
  for (const k of MEAL_KEYS) {
    if (!Array.isArray(meals[k])) meals[k] = [];
  }
  return { ...BLANK_DAY(), ...day, meals };
}

export function saveDay(date, patch) {
  const id = getConfig()?.currentProfile;
  const p = getProfile(id);
  if (!p) return;
  const existing = p.logs[date] || BLANK_DAY();
  p.logs[date] = { ...existing, ...patch };
  saveProfile(id, p);
  return p.logs[date];
}

export function addFoodToMeal(date, mealKey, food) {
  const id = getConfig()?.currentProfile;
  const p = getProfile(id);
  if (!p) return;
  const day = p.logs[date] || BLANK_DAY();
  const meals = day.meals || { breakfast: [], lunch: [], dinner: [], snacks: [] };
  meals[mealKey] = [...(meals[mealKey] || []), food];
  day.meals = meals;
  p.logs[date] = day;
  saveProfile(id, p);
  return day;
}

export function removeFoodFromMeal(date, mealKey, foodId) {
  const id = getConfig()?.currentProfile;
  const p = getProfile(id);
  if (!p) return;
  const day = p.logs[date];
  if (!day || !day.meals?.[mealKey]) return;
  day.meals[mealKey] = day.meals[mealKey].filter((f) => f.id !== foodId);
  saveProfile(id, p);
  return day;
}

export function setSteps(date, steps) {
  return saveDay(date, { steps: Number(steps) || 0 });
}

export function setWeight(date, weight) {
  const w = weight === '' || weight == null ? null : Number(weight);
  return saveDay(date, { weight: w });
}

// ---------- Favorites + Recent ----------

export function getFavorites() {
  return getProfile()?.favorites || [];
}

export function toggleFavorite(food) {
  const id = getConfig()?.currentProfile;
  const p = getProfile(id);
  if (!p) return [];
  const exists = p.favorites.find((f) => f.fdcId === food.fdcId);
  if (exists) {
    p.favorites = p.favorites.filter((f) => f.fdcId !== food.fdcId);
  } else {
    p.favorites = [
      { fdcId: food.fdcId, name: food.name, per100g: food.per100g },
      ...p.favorites,
    ].slice(0, 50);
  }
  saveProfile(id, p);
  return p.favorites;
}

export function isFavorite(fdcId) {
  return !!getProfile()?.favorites?.find((f) => f.fdcId === fdcId);
}

export function getRecent() {
  return getProfile()?.recent || [];
}

export function addRecent(food) {
  const id = getConfig()?.currentProfile;
  const p = getProfile(id);
  if (!p) return [];
  let recent = p.recent.filter((r) => r.fdcId !== food.fdcId);
  recent.unshift({ fdcId: food.fdcId, name: food.name, per100g: food.per100g });
  p.recent = recent.slice(0, 20);
  saveProfile(id, p);
  return p.recent;
}

// ---------- Reset / export / import ----------

export function resetCurrentProfile() {
  const id = getConfig()?.currentProfile;
  const p = getProfile(id);
  if (!p) return;
  const fresh = blankProfile(p.name, p.settings);
  saveProfile(id, fresh);
  return fresh;
}

export function exportAll() {
  const cfg = getConfig();
  if (!cfg) return null;
  const out = {
    config: { ...cfg, passwordHash: undefined, passwordSalt: undefined },
    profiles: {},
    exportedAt: new Date().toISOString(),
    version: 2,
  };
  for (const id of cfg.profiles) {
    out.profiles[id] = read(KEYS.PROFILE(id), null);
  }
  return out;
}

export function importIntoCurrent(json) {
  if (!json || !json.profiles) throw new Error('Invalid backup file');
  const id = getConfig()?.currentProfile;
  const target = getProfile(id);
  if (!target) throw new Error('No active profile');
  const firstKey = Object.keys(json.profiles)[0];
  const incoming = json.profiles[firstKey];
  if (!incoming) throw new Error('Backup contains no profile');
  const merged = {
    ...target,
    settings: { ...target.settings, ...(incoming.settings || {}) },
    logs: { ...target.logs, ...(incoming.logs || {}) },
    favorites: dedupeBy(
      [...(target.favorites || []), ...(incoming.favorites || [])],
      (f) => f.fdcId
    ),
    recent: dedupeBy(
      [...(incoming.recent || []), ...(target.recent || [])],
      (f) => f.fdcId
    ).slice(0, 20),
  };
  saveProfile(id, merged);
  return merged;
}

function dedupeBy(arr, key) {
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

// ---------- Legacy migration ----------

export function migrateLegacy() {
  const old = read(KEYS.LEGACY_LOGS, null);
  const oldRecent = read(KEYS.LEGACY_RECENT, null);
  if (!old && !oldRecent) return false;
  const id = getConfig()?.currentProfile;
  const p = getProfile(id);
  if (!p) return false;
  if (old) {
    for (const [date, entry] of Object.entries(old)) {
      const day = BLANK_DAY();
      day.weight = entry.weight ?? null;
      day.steps = Number(entry.steps) || 0;
      day.meals.snacks = (entry.foods || []).map((f) => ({ ...f }));
      p.logs[date] = day;
    }
  }
  if (oldRecent) {
    p.recent = oldRecent.slice(0, 20);
  }
  saveProfile(id, p);
  del(KEYS.LEGACY_LOGS);
  del(KEYS.LEGACY_RECENT);
  return true;
}

// ---------- Unlock state ----------

export function getUnlockUntil() {
  return Number(localStorage.getItem(KEYS.UNLOCK)) || 0;
}

export function setUnlockedFor(ms) {
  localStorage.setItem(KEYS.UNLOCK, String(Date.now() + ms));
}

export function lock() {
  del(KEYS.UNLOCK);
}

export function isUnlocked() {
  return getUnlockUntil() > Date.now();
}

// ---------- Hard wipe ----------

export function wipeEverything() {
  const cfg = getConfig();
  if (cfg?.profiles) for (const id of cfg.profiles) del(KEYS.PROFILE(id));
  del(KEYS.CONFIG);
  del(KEYS.UNLOCK);
}

// ---------- Back-compat layer for Phase 1 transition ----------
// Auto-bootstraps a default "adrian" profile if none exists, then exposes
// the old flat API on top of the new profile-aware storage.

function ensureBootstrapped() {
  if (!getConfig()) {
    createProfile('adrian', 'Adrian');
    migrateLegacy();
  }
}

export function getAllLogs() {
  ensureBootstrapped();
  const p = getProfile();
  const out = {};
  for (const [date, day] of Object.entries(p?.logs || {})) {
    const foods = [];
    for (const k of MEAL_KEYS) for (const f of day.meals?.[k] || []) foods.push(f);
    out[date] = { steps: day.steps, weight: day.weight, foods };
  }
  return out;
}

export function saveAllLogs() {
  // no-op; writes go through specific helpers now
}

export function addFood(date, food) {
  ensureBootstrapped();
  return addFoodToMeal(date, 'snacks', food);
}

export function removeFood(date, foodId) {
  ensureBootstrapped();
  const p = getProfile();
  const day = p?.logs?.[date];
  if (!day) return null;
  for (const k of MEAL_KEYS) {
    if ((day.meals?.[k] || []).some((f) => f.id === foodId)) {
      return removeFoodFromMeal(date, k, foodId);
    }
  }
  return day;
}

export function getRecentFoods() {
  ensureBootstrapped();
  return getRecent();
}

export function addRecentFood(food) {
  ensureBootstrapped();
  return addRecent(food);
}
