import { ANTHROPIC_API, AI_MODEL, AI_STORAGE_KEY } from './constants.js';
import { lastNDaysKeys } from './dates.js';
import { totalsForDay } from './targets.js';

export function getAIConfig() {
  try {
    const raw = localStorage.getItem(AI_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { apiKey: '', enabled: false, lastCoach: null };
  } catch {
    return { apiKey: '', enabled: false, lastCoach: null };
  }
}

export function saveAIConfig(cfg) {
  try {
    localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(cfg));
  } catch {}
}

export function hasAIKey() {
  const c = getAIConfig();
  return !!(c.enabled && c.apiKey && c.apiKey.startsWith('sk-'));
}

async function callClaude({ system, messages, maxTokens = 1024, model = AI_MODEL }) {
  const cfg = getAIConfig();
  if (!cfg.apiKey) throw new Error('No API key set');
  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': cfg.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  return { text, usage: data.usage };
}

function extractJSON(text) {
  const m = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!m) throw new Error('No JSON in response');
  return JSON.parse(m[0]);
}

const FOOD_SYSTEM = `You are a nutrition-parsing assistant for a fitness tracker. Given a user's free-text description of a meal, return a JSON array of food items with estimated macros.

Output ONLY a JSON array, no prose. Each item has:
{
  "name": "string — concise food name",
  "serving": "string — e.g. '2 eggs', '1 cup', '4 oz'",
  "calories": number,
  "protein": number (grams),
  "fat": number (grams),
  "carbs": number (grams),
  "fiber": number (grams, 0 if unknown),
  "sugar": number (grams, 0 if unknown),
  "sodium": number (mg, 0 if unknown)
}

Use standard USDA reference values. Be realistic with portion sizes. Round to whole numbers.`;

export async function parseFoodText(text) {
  const { text: raw } = await callClaude({
    system: FOOD_SYSTEM,
    messages: [{ role: 'user', content: text }],
    maxTokens: 1024,
  });
  const items = extractJSON(raw);
  return items.map(normalizeFoodItem);
}

const PHOTO_SYSTEM = `You are a nutrition-estimating assistant analyzing a meal photo. Identify visible foods and estimate portions and macros.

Output ONLY a JSON array, no prose. Each item has:
{
  "name": "string",
  "serving": "string — your estimated portion, e.g. '~4 oz', '1 cup'",
  "calories": number,
  "protein": number,
  "fat": number,
  "carbs": number,
  "fiber": number,
  "sugar": number,
  "sodium": number
}

If portions are ambiguous, err on the conservative side. Round to whole numbers.`;

export async function parseFoodPhoto(base64DataUrl) {
  const match = base64DataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data');
  const mediaType = match[1];
  const data = match[2];
  const { text: raw } = await callClaude({
    system: PHOTO_SYSTEM,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
        { type: 'text', text: 'What foods are in this photo? Estimate portions and macros.' },
      ],
    }],
    maxTokens: 1024,
  });
  const items = extractJSON(raw);
  return items.map(normalizeFoodItem);
}

function normalizeFoodItem(it) {
  return {
    name: String(it.name || 'Unknown').slice(0, 80),
    serving: String(it.serving || '1 serving').slice(0, 40),
    calories: Math.max(0, Math.round(Number(it.calories) || 0)),
    protein: Math.max(0, Math.round(Number(it.protein) || 0)),
    fat: Math.max(0, Math.round(Number(it.fat) || 0)),
    carbs: Math.max(0, Math.round(Number(it.carbs) || 0)),
    fiber: Math.max(0, Math.round(Number(it.fiber) || 0)),
    sugar: Math.max(0, Math.round(Number(it.sugar) || 0)),
    sodium: Math.max(0, Math.round(Number(it.sodium) || 0)),
  };
}

const COACH_SYSTEM = `You are a concise fitness coach writing a weekly recap for a user on a cut (caloric deficit). Given 7 days of data, write EXACTLY 3 sentences:

1. A specific observation about the week (protein hit rate, weight movement, streak, etc).
2. One thing they did well.
3. One specific, actionable suggestion for next week.

Be direct. No fluff. No emojis. No headers. Under 75 words total.`;

export async function generateWeeklyCoach(profile) {
  const summary = buildWeekSummary(profile);
  const { text } = await callClaude({
    system: COACH_SYSTEM,
    messages: [{ role: 'user', content: summary }],
    maxTokens: 256,
  });
  const note = text.trim();
  const cfg = getAIConfig();
  cfg.lastCoach = { text: note, at: new Date().toISOString() };
  saveAIConfig(cfg);
  return note;
}

function buildWeekSummary(profile) {
  const keys = lastNDaysKeys(7, new Date());
  const target = profile?.settings?.calorieTarget || 1800;
  const proteinTarget = profile?.settings?.proteinTarget || 150;
  const goalWeight = profile?.settings?.goalWeight;
  const lines = [];
  lines.push(`Targets: ${target} kcal, ${proteinTarget}g protein/day. Goal weight: ${goalWeight || 'n/a'}.`);
  lines.push('Last 7 days:');
  let weighIns = [];
  for (const k of keys) {
    const day = profile?.logs?.[k];
    if (!day) { lines.push(`${k}: (no log)`); continue; }
    const t = totalsForDay(day);
    const workouts = (day.workouts || []).length;
    const cardio = (day.cardio || []).length;
    const parts = [`${t.calories} kcal`, `${t.protein}g P`];
    if (day.weight) { parts.push(`${day.weight} lb`); weighIns.push({ k, w: day.weight }); }
    if (day.steps) parts.push(`${day.steps} steps`);
    if (workouts) parts.push(`${workouts} lift`);
    if (cardio) parts.push(`${cardio} cardio`);
    lines.push(`${k}: ${parts.join(', ')}`);
  }
  if (weighIns.length >= 2) {
    const delta = weighIns[weighIns.length - 1].w - weighIns[0].w;
    lines.push(`Weight change: ${delta > 0 ? '+' : ''}${delta.toFixed(1)} lb over week.`);
  }
  return lines.join('\n');
}
