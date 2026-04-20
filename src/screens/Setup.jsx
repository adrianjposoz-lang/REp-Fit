import React, { useState } from 'react';
import { setPassword } from '../lib/auth.js';
import { createProfile, migrateLegacy } from '../lib/storage.js';
import { ADRIAN_DEFAULTS } from '../lib/constants.js';
import { todayKey, addDays } from '../lib/dates.js';

export default function Setup({ onComplete }) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [name, setName] = useState('Adrian');
  const [calorieTarget, setCalorieTarget] = useState(ADRIAN_DEFAULTS.calorieTarget);
  const [proteinTarget, setProteinTarget] = useState(ADRIAN_DEFAULTS.proteinTarget);
  const [fatTarget, setFatTarget] = useState(ADRIAN_DEFAULTS.fatTarget);
  const [carbTarget, setCarbTarget] = useState(ADRIAN_DEFAULTS.carbTarget);
  const [stepsTarget, setStepsTarget] = useState(ADRIAN_DEFAULTS.stepsTarget);
  const [startWeight, setStartWeight] = useState(ADRIAN_DEFAULTS.startWeight);
  const [goalWeight, setGoalWeight] = useState(ADRIAN_DEFAULTS.goalWeight);
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
    const nm = (name || '').trim() || 'Adrian';
    setBusy(true);
    try {
      await setPassword(pw);
      const overrides = {
        name: nm,
        calorieTarget: Number(calorieTarget) || ADRIAN_DEFAULTS.calorieTarget,
        proteinTarget: Number(proteinTarget) || ADRIAN_DEFAULTS.proteinTarget,
        fatTarget: Number(fatTarget) || ADRIAN_DEFAULTS.fatTarget,
        carbTarget: Number(carbTarget) || ADRIAN_DEFAULTS.carbTarget,
        stepsTarget: Number(stepsTarget) || ADRIAN_DEFAULTS.stepsTarget,
        startWeight: Number(startWeight) || ADRIAN_DEFAULTS.startWeight,
        goalWeight: Number(goalWeight) || ADRIAN_DEFAULTS.goalWeight,
        startDate: todayKey(),
        endDate: todayKey(addDays(new Date(), 89)),
      };
      const id = nm.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'adrian';
      createProfile(id, nm, { ...ADRIAN_DEFAULTS, ...overrides });
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
        <div className="auth-brand-mark">R</div>
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
                placeholder="Adrian"
              />
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-title">3. Targets (optional)</div>
          <div className="setup-grid">
            <NumField label="Calories" value={calorieTarget} onChange={setCalorieTarget} />
            <NumField label="Protein (g)" value={proteinTarget} onChange={setProteinTarget} />
            <NumField label="Fat (g)" value={fatTarget} onChange={setFatTarget} />
            <NumField label="Carbs (g)" value={carbTarget} onChange={setCarbTarget} />
            <NumField label="Steps" value={stepsTarget} onChange={setStepsTarget} />
            <NumField label="Start lbs" value={startWeight} onChange={setStartWeight} step="0.1" />
            <NumField label="Goal lbs" value={goalWeight} onChange={setGoalWeight} step="0.1" />
          </div>
          <div className="hint" style={{ marginTop: 10 }}>
            Defaults loaded from Adrian&apos;s baseline — adjust later in Settings.
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

function NumField({ label, value, onChange, step = '1' }) {
  return (
    <div className="setup-field">
      <label className="h-label">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        className="auth-input"
        value={value}
        step={step}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
