import { lastNDaysKeys } from './dates.js';
import { totalsForDay } from './targets.js';

// One pound of fat ≈ 3500 kcal. Two-week rolling calc.
// TDEE = avg daily calories consumed + (weight_change_lbs × 3500) / days
// A negative weight change lowers TDEE; positive raises it.

export function estimateTDEE(profile, now = new Date(), windowDays = 14) {
  if (!profile) return null;
  const keys = lastNDaysKeys(windowDays, now);
  const firstWithWeight = keys.find((k) => typeof profile.logs?.[k]?.weight === 'number');
  const lastWithWeight = [...keys].reverse().find((k) => typeof profile.logs?.[k]?.weight === 'number');
  if (!firstWithWeight || !lastWithWeight || firstWithWeight === lastWithWeight) return null;

  const wStart = profile.logs[firstWithWeight].weight;
  const wEnd = profile.logs[lastWithWeight].weight;
  const weightChange = wEnd - wStart; // lbs (negative if losing)

  let sum = 0;
  let days = 0;
  for (const k of keys) {
    const day = profile.logs?.[k];
    if (!day) continue;
    const t = totalsForDay(day);
    if (t.calories === 0) continue;
    sum += t.calories;
    days += 1;
  }
  if (days < 5) return null; // need at least ~5 logged days

  const avgIntake = sum / days;
  const tdee = avgIntake + (weightChange * 3500) / windowDays;
  return {
    tdee: Math.round(tdee),
    avgIntake: Math.round(avgIntake),
    weightChange: Math.round(weightChange * 10) / 10,
    loggedDays: days,
    windowDays,
  };
}

// Suggest a calorie target based on goal rate.
// ratePctPerWeek: 0.5 = 0.5% bodyweight/week (moderate cut), 1.0 = aggressive.
export function suggestCalorieTarget(tdee, currentWeight, ratePctPerWeek = 0.7) {
  if (!tdee || !currentWeight) return null;
  const lbsPerWeek = currentWeight * (ratePctPerWeek / 100);
  const dailyDeficit = (lbsPerWeek * 3500) / 7;
  return Math.round(tdee - dailyDeficit);
}

// Plateau detection: weight trend over last 14 days.
// Signals plateau if abs(weight change) < 0.3 lbs AND avg calories < tdee - 300.
export function detectPlateau(profile, now = new Date()) {
  const estimate = estimateTDEE(profile, now, 14);
  if (!estimate) return { plateau: false, reason: 'not enough data' };
  const { tdee, avgIntake, weightChange } = estimate;
  const clearlyInDeficit = avgIntake < tdee - 300;
  const weightStuck = Math.abs(weightChange) < 0.3;
  if (clearlyInDeficit && weightStuck) {
    return {
      plateau: true,
      reason: `eating ${tdee - avgIntake} kcal below TDEE but weight only moved ${weightChange} lb in 14 d — likely water retention or TDEE drift. Consider a 1-day refeed at maintenance or a 5-day diet break.`,
      tdee,
      avgIntake,
      weightChange,
    };
  }
  return { plateau: false, tdee, avgIntake, weightChange };
}

// When to refeed: every ~10-14 low-calorie days, suggest a refeed at TDEE.
export function shouldRefeed(profile, now = new Date()) {
  const keys = lastNDaysKeys(14, now);
  let consecutiveLow = 0;
  for (const k of [...keys].reverse()) {
    const day = profile?.logs?.[k];
    if (!day) break;
    const t = totalsForDay(day);
    if (t.calories === 0) break;
    const target = profile.settings?.calorieTarget || 1800;
    if (t.calories <= target + 100) consecutiveLow += 1;
    else break;
  }
  return consecutiveLow >= 10;
}

// Linear-regression forecast of when the user hits their goal weight.
// Uses the last N weigh-ins; returns null when there's not enough data
// or the trend is going the wrong way.
export function forecastGoalDate(profile, now = new Date(), windowDays = 42) {
  const s = profile?.settings;
  if (!s || typeof s.goalWeight !== 'number') return null;
  if (!profile.logs) return null;

  const cutoff = now.getTime() - windowDays * 24 * 3600 * 1000;
  const points = [];
  for (const [dateKey, day] of Object.entries(profile.logs)) {
    if (typeof day?.weight !== 'number' || Number.isNaN(day.weight)) continue;
    const [y, m, d] = dateKey.split('-').map(Number);
    const t = new Date(y, m - 1, d).getTime();
    if (t < cutoff) continue;
    points.push({ t, w: day.weight });
  }
  if (points.length < 4) return null;
  points.sort((a, b) => a.t - b.t);

  const n = points.length;
  const meanT = points.reduce((s, p) => s + p.t, 0) / n;
  const meanW = points.reduce((s, p) => s + p.w, 0) / n;
  let num = 0, den = 0;
  for (const p of points) {
    num += (p.t - meanT) * (p.w - meanW);
    den += (p.t - meanT) ** 2;
  }
  if (den === 0) return null;
  const slopePerMs = num / den; // lb / ms
  const lbsPerWeek = slopePerMs * 7 * 24 * 3600 * 1000;

  const latest = points[n - 1];
  const deltaToGoal = s.goalWeight - latest.w;

  // Slope must head toward the goal.
  if ((deltaToGoal < 0 && slopePerMs >= 0) || (deltaToGoal > 0 && slopePerMs <= 0)) {
    return { lbsPerWeek: Math.round(lbsPerWeek * 100) / 100, eta: null, trend: 'wrong-direction' };
  }
  if (Math.abs(slopePerMs) < 1e-12) return { lbsPerWeek: 0, eta: null, trend: 'flat' };

  const msToGoal = deltaToGoal / slopePerMs;
  if (msToGoal <= 0) return { lbsPerWeek: Math.round(lbsPerWeek * 100) / 100, eta: null, trend: 'already-hit' };

  const eta = new Date(latest.t + msToGoal);
  return {
    lbsPerWeek: Math.round(lbsPerWeek * 100) / 100,
    eta,
    trend: 'on-track',
    weighIns: n,
  };
}

// 1-rep-max estimate — Epley formula.
export function estimate1RM(weight, reps) {
  const w = Number(weight) || 0;
  const r = Number(reps) || 0;
  if (w <= 0 || r <= 0) return 0;
  if (r === 1) return w;
  return Math.round(w * (1 + r / 30));
}

// Scan all logged workouts for an exercise's best 1RM.
export function bestLift(profile, exerciseName) {
  if (!profile?.logs) return null;
  let best = 0;
  let bestEntry = null;
  for (const [date, day] of Object.entries(profile.logs)) {
    for (const w of day.workouts || []) {
      for (const ex of w.exercises || []) {
        if (ex.name !== exerciseName) continue;
        for (const s of ex.sets || []) {
          const oneRM = estimate1RM(s.weight, s.reps);
          if (oneRM > best) {
            best = oneRM;
            bestEntry = { date, weight: s.weight, reps: s.reps };
          }
        }
      }
    }
  }
  return best > 0 ? { oneRM: best, ...bestEntry } : null;
}
