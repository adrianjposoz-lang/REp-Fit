import { BLANK_DAY } from './constants.js';

const CFG_KEY = 'rep_fit:healthSync';

// Config stored OUTSIDE the profile so exportAll doesn't leak the token.
// Shape: { gistId, token, lastSyncedAt, autoSync }
export function loadHealthConfig() {
  try {
    const raw = localStorage.getItem(CFG_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveHealthConfig(cfg) {
  try {
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  } catch {}
}

export function clearHealthConfig() {
  try {
    localStorage.removeItem(CFG_KEY);
  } catch {}
}

// Fetches the gist and returns the parsed JSON from its first file.
// Expected gist content shape:
// {
//   "version": 1,
//   "updatedAt": "2026-04-19T08:00:00Z",
//   "days": {
//     "2026-04-18": {
//       "steps": 12480,
//       "activeKcal": 520,
//       "weight": 221.4,
//       "workouts": [
//         {"type": "Strength Training", "minutes": 45, "calories": 380}
//       ]
//     }
//   }
// }
export async function fetchHealthGist(gistId, token) {
  if (!gistId) throw new Error('Gist ID not configured');
  const headers = { Accept: 'application/vnd.github+json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? 'Gist not found (check the ID and that the token has gist scope)'
        : `GitHub API ${res.status}`
    );
  }
  const gist = await res.json();
  const files = Object.values(gist.files || {});
  if (files.length === 0) throw new Error('Gist has no files');
  const raw = files[0].content;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Gist content is not valid JSON');
  }
  if (!parsed || typeof parsed !== 'object' || !parsed.days) {
    throw new Error('Gist JSON missing "days" object');
  }
  return parsed;
}

// Merge a parsed gist payload into a profile.
// - Does NOT overwrite weight if the user already logged one manually that day.
// - Steps are overwritten (Watch wins — user probably didn't type a number).
// - Watch workout sessions appended to day.cardio (deduped by synthetic ID).
// Returns { touched: number of days modified }.
export function mergeHealthIntoProfile(profile, payload) {
  if (!profile || !payload || !payload.days) return { touched: 0 };
  let touched = 0;
  for (const [date, entry] of Object.entries(payload.days)) {
    if (!entry || typeof entry !== 'object') continue;
    const existing = profile.logs[date] || BLANK_DAY();
    let changed = false;

    if (typeof entry.steps === 'number' && entry.steps !== existing.steps) {
      existing.steps = Math.round(entry.steps);
      changed = true;
    }

    if (
      typeof entry.weight === 'number' &&
      !Number.isNaN(entry.weight) &&
      (existing.weight == null || existing.weight === 0)
    ) {
      existing.weight = Math.round(entry.weight * 10) / 10;
      changed = true;
    }

    if (Array.isArray(entry.workouts)) {
      const existingCardio = existing.cardio || [];
      const existingKeys = new Set(
        existingCardio
          .filter((c) => c.sourceId)
          .map((c) => c.sourceId)
      );
      for (const w of entry.workouts) {
        const sourceId = `watch:${date}:${w.type || 'workout'}:${w.minutes || 0}:${w.calories || 0}`;
        if (existingKeys.has(sourceId)) continue;
        existingCardio.push({
          id: `watch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          sourceId,
          type: w.type || 'Watch workout',
          minutes: Number(w.minutes) || 0,
          calories: Number(w.calories) || undefined,
        });
        changed = true;
      }
      existing.cardio = existingCardio;
    }

    if (changed) {
      profile.logs[date] = existing;
      touched += 1;
    }
  }
  return { touched };
}
