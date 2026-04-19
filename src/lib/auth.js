import { DEFAULT_PASSWORD } from './constants.js';
import { getConfig, saveConfig } from './storage.js';

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomSalt(len = 16) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return bytesToHex(arr);
}

export async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return bytesToHex(new Uint8Array(buf));
}

export async function hashPassword(password, salt) {
  return sha256(`${salt}::${password}`);
}

export async function setPassword(password) {
  const salt = randomSalt();
  const hash = await hashPassword(password, salt);
  const cfg = getConfig() || {
    profiles: [],
    currentProfile: null,
    createdAt: Date.now(),
    version: 2,
  };
  cfg.passwordHash = hash;
  cfg.passwordSalt = salt;
  saveConfig(cfg);
}

export async function verifyPassword(password) {
  const cfg = getConfig();
  if (!cfg?.passwordHash || !cfg?.passwordSalt) {
    return password === DEFAULT_PASSWORD;
  }
  const hash = await hashPassword(password, cfg.passwordSalt);
  return hash === cfg.passwordHash;
}

export function hasPassword() {
  const cfg = getConfig();
  return !!cfg?.passwordHash;
}
