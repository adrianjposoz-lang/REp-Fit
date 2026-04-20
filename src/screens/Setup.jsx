import React, { useState } from 'react';
import { setPassword } from '../lib/auth.js';
import { createProfile, migrateLegacy } from '../lib/storage.js';
import { NEW_USER_DEFAULTS } from '../lib/constants.js';
import { todayKey, addDays } from '../lib/dates.js';

export default function Setup({ onComplete }) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [name, setName] = useState('');
  const [calorieTarget, setCalorieTarget] = useState('');
  const [proteinTarget, setProteinTarget] = useState('');
  const [fatTarget, setFatTarget] = useState('');
  const [carbTarget, setCarbTarget] = useState('');
  const [stepsTarget, setStepsTarget] = useState('');
  const [startWeight, setStartWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e?.preventDefault?.();
    if (busy) return;
    setError(null);
    if (!pw || pw.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    if (pw !== pw2) {
      setError('Passwords do not match.');
      return;
    }
    const nm = (name || '').trim();
    if (!nm) {
      setError('Please enter a name.');
      return;
    }
    setBusy(true);
    try {
      await setPassword(pw);
      const overrides = {
        name: nm,
        calorieTarget: numOr(calorieTarget, NEW_USER_DEFAULTS.calorieTarget),
        proteinTarget: numOr(proteinTarget, NEW_USER_DEFAULTS.proteinTarget),
        fatTarget: numOr(fatTarget, NEW_USER_DEFAULTS.fatTarget),
        carbTarget: numOr(carbTarget, NEW_USER_DEFAULTS.carbTarget),
        stepsTarget: numOr(stepsTarget, NEW_USER_DEFAULTS.stepsTarget),
        startWeight: numOr(startWeight, null),
        goalWeight: numOr(goalWeight, null),
        startDate: todayKey(),
        endDate: todayKey(addDays(new Date(), 89)),
      };
      const id = nm.toLowerCase().replace(/[^a-z0-9]+/g, '') || `p${Date.now()}`;
      createProfile(id, nm, { ...NEW_USER_DEFAULTS, ...overrides });
      try {
        migrateLegacy();
      } catch {}
      onComplete?.();
    } catch (err) {
      setError('Could not complete setup.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen auth-screen">
      <div className="auth-brand">
        <div className="auth-brand-mark">F</div>
        <div className="auth-brand-text">
          <div className="auth-brand-title">Welcome</div>
          <div className="auth-brand-sub">Let&apos;s set up your tracker.</div>
        </div>
      </div>

      <form className="setup-form" onSubmit={submit}>
        <section className="card">
          <div className="card-title">1. Password</div>
          <div className="setup-fields">
            <div className="setup-field">
              <label className="h-label">New password</label>
              <input
                type="password"
                className="auth-input"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="4+ characters"
                autoComplete="new-password"
              />
            </div>
            <div className="setup-field">
              <label className="h-label">Confirm</label>
              <input
                type="password"
                className="auth-input"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
              />
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-title">2. Profile</div>
          <div className="setup-fields">
            <div className="setup-field">
              <label className="h-label">Name</label>
              <input
                type="text"
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-title">3. Targets (optional)</div>
          <div className="setup-grid">
            <NumField label="Calories" value={calorieTarget} onChange={setCalorieTarget} placeholder={String(NEW_USER_DEFAULTS.calorieTarget)} />
            <NumField label="Protein (g)" value={proteinTarget} onChange={setProteinTarget} placeholder={String(NEW_USER_DEFAULTS.proteinTarget)} />
            <NumField label="Fat (g)" value={fatTarget} onChange={setFatTarget} placeholder={String(NEW_USER_DEFAULTS.fatTarget)} />
            <NumField label="Carbs (g)" value={carbTarget} onChange={setCarbTarget} placeholder={String(NEW_USER_DEFAULTS.carbTarget)} />
            <NumField label="Steps" value={stepsTarget} onChange={setStepsTarget} placeholder={String(NEW_USER_DEFAULTS.stepsTarget)} />
            <NumField label="Start lbs" value={startWeight} onChange={setStartWeight} step="0.1" placeholder="e.g. 180" />
            <NumField label="Goal lbs" value={goalWeight} onChange={setGoalWeight} step="0.1" placeholder="e.g. 160" />
          </div>
          <div className="hint" style={{ marginTop: 10 }}>
            Leave blank to use common starting points — adjust anytime in Settings.
          </div>
        </section>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="btn-primary auth-submit" disabled={busy}>
          {busy ? 'Saving…' : 'Get started'}
        </button>

        <div className="auth-footnote">
          Your data stays in this browser. The password is a speed-bump, not bank-grade
          security.
        </div>
      </form>
    </div>
  );
}

function NumField({ label, value, onChange, step = '1', placeholder }) {
  return (
    <div className="setup-field">
      <label className="h-label">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        className="auth-input"
        value={value}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function numOr(v, fallback) {
  if (v === '' || v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
