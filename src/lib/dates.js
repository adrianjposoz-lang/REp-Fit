import { USER } from './constants.js';

export function todayKey(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function diffDays(a, b) {
  const ms = 24 * 60 * 60 * 1000;
  return Math.floor((a.getTime() - b.getTime()) / ms);
}

export function dayNumber(now = new Date()) {
  const start = parseKey(USER.startDate);
  const n = diffDays(startOfDay(now), startOfDay(start)) + 1;
  return Math.max(1, Math.min(USER.programDays, n));
}

export function rawDayNumber(now = new Date()) {
  const start = parseKey(USER.startDate);
  return diffDays(startOfDay(now), startOfDay(start)) + 1;
}

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function formatLongDate(d) {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function formatShortDate(d) {
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function lastNDaysKeys(n, now = new Date()) {
  const keys = [];
  for (let i = n - 1; i >= 0; i--) {
    keys.push(todayKey(addDays(now, -i)));
  }
  return keys;
}
