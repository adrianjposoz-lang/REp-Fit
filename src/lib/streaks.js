import { lastNDaysKeys } from './dates.js';

function isDayLogged(day) {
  if (!day) return false;
  if (typeof day.weight === 'number' && !Number.isNaN(day.weight)) return true;
  if (Array.isArray(day.workouts) && day.workouts.length > 0) return true;
  if (Array.isArray(day.cardio) && day.cardio.length > 0) return true;
  const meals = day.meals || {};
  for (const k of Object.keys(meals)) {
    const entries = meals[k] || [];
    for (const f of entries) {
      if ((Number(f.calories) || 0) > 0) return true;
    }
  }
  return false;
}

export function currentStreak(profile, now = new Date()) {
  if (!profile || !profile.logs) return { days: 0, bestEver: 0 };
  const logs = profile.logs;

  const scanKeys = lastNDaysKeys(3650, now);
  let days = 0;
  for (let i = scanKeys.length - 1; i >= 0; i--) {
    const k = scanKeys[i];
    if (isDayLogged(logs[k])) {
      days += 1;
    } else {
      break;
    }
  }

  const sortedKeys = Object.keys(logs).sort();
  let bestEver = 0;
  let run = 0;
  let prevKey = null;
  for (const k of sortedKeys) {
    if (!isDayLogged(logs[k])) {
      run = 0;
      prevKey = k;
      continue;
    }
    if (prevKey && isConsecutive(prevKey, k)) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > bestEver) bestEver = run;
    prevKey = k;
  }

  if (days > bestEver) bestEver = days;
  return { days, bestEver };
}

function isConsecutive(prevKey, currKey) {
  const [py, pm, pd] = prevKey.split('-').map(Number);
  const [cy, cm, cd] = currKey.split('-').map(Number);
  const prev = new Date(py, pm - 1, pd);
  const curr = new Date(cy, cm - 1, cd);
  const diff = Math.round((curr - prev) / (24 * 60 * 60 * 1000));
  return diff === 1;
}

export function crossedWeightMilestone(prevWeight, newWeight, goalWeight) {
  const prev = Number(prevWeight);
  const next = Number(newWeight);
  const goal = Number(goalWeight);
  if (!Number.isFinite(prev) || !Number.isFinite(next) || !Number.isFinite(goal)) return null;
  if (prev === next) return null;

  const direction = goal < prev ? -1 : goal > prev ? 1 : 0;
  if (direction === 0) return null;

  if (direction === -1 && next >= prev) return null;
  if (direction === 1 && next <= prev) return null;

  const lo = Math.min(prev, next);
  const hi = Math.max(prev, next);

  if (direction === -1) {
    const firstBelow = Math.floor(prev / 5) * 5;
    for (let v = firstBelow; v >= lo; v -= 5) {
      if (v < prev && v >= next && v >= goal) {
        return { crossed: true, value: v };
      }
    }
    return null;
  } else {
    const firstAbove = Math.ceil(prev / 5) * 5;
    for (let v = firstAbove; v <= hi; v += 5) {
      if (v > prev && v <= next && v <= goal) {
        return { crossed: true, value: v };
      }
    }
    return null;
  }
}
