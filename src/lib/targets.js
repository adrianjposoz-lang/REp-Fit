import { MEAL_KEYS } from './constants.js';
import { lastNDaysKeys, parseKey } from './dates.js';

export function totalsForDay(day) {
  const t = { calories: 0, protein: 0, fat: 0, carbs: 0 };
  if (!day || !day.meals) return t;
  for (const k of MEAL_KEYS) {
    for (const f of day.meals[k] || []) {
      t.calories += Number(f.calories) || 0;
      t.protein += Number(f.protein) || 0;
      t.fat += Number(f.fat) || 0;
      t.carbs += Number(f.carbs) || 0;
    }
  }
  return t;
}

export function programDays(settings) {
  if (!settings?.startDate) return 90;
  const start = parseKey(settings.startDate);
  if (settings.endDate) {
    const end = parseKey(settings.endDate);
    const ms = end - start;
    return Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)) + 1);
  }
  return 90;
}

export function rawDayNumber(settings, now = new Date()) {
  if (!settings?.startDate) return 1;
  const start = parseKey(settings.startDate);
  const ms = startOfDay(now) - startOfDay(start);
  return Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function sevenDayWeight(profile, now = new Date()) {
  const keys = lastNDaysKeys(7, now);
  const vals = keys
    .map((k) => profile?.logs?.[k]?.weight)
    .filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function estimatedBodyFat(profile, currentWeight) {
  const s = profile?.settings;
  if (!s) return null;
  const lost = s.startWeight - currentWeight;
  const fatMass = Math.max(0, s.startFatMass - lost);
  if (currentWeight <= 0) return null;
  return (fatMass / currentWeight) * 100;
}

export function complianceForRange(profile, n = 7, now = new Date()) {
  const s = profile?.settings;
  if (!s) return null;
  const keys = lastNDaysKeys(n, now);
  let calHits = 0,
    proHits = 0,
    days = 0;
  for (const k of keys) {
    const day = profile?.logs?.[k];
    if (!day) continue;
    const t = totalsForDay(day);
    if (t.calories === 0) continue;
    days += 1;
    if (Math.abs(t.calories - s.calorieTarget) <= 100) calHits += 1;
    if (t.protein >= s.proteinTarget - 10) proHits += 1;
  }
  return { days, calHits, proHits };
}
