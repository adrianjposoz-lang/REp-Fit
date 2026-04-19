import React, { useMemo, useRef, useState } from 'react';
import {
  patchSettings,
  getConfig,
  getProfile,
  createProfile,
  deleteProfile,
  exportAll,
  importIntoCurrent,
  resetCurrentProfile,
  wipeEverything,
} from '../lib/storage.js';
import { setPassword, verifyPassword } from '../lib/auth.js';
import { ADRIAN_DEFAULTS } from '../lib/constants.js';

export default function Settings({
  profile,
  onChange,
  onClose,
  onLock,
  onProfileSwitch,
}) {
  const s = profile?.settings || {};

  const [form, setForm] = useState(() => ({
    name: s.name || '',
    startDate: s.startDate || '',
    endDate: s.endDate || '',
    startWeight: s.startWeight ?? '',
    startBodyFat: s.startBodyFat ?? '',
    startFatMass: s.startFatMass ?? '',
    startLeanMass: s.startLeanMass ?? '',
    goalWeight: s.goalWeight ?? '',
    goalBodyFat: s.goalBodyFat ?? '',
    calorieTarget: s.calorieTarget ?? '',
    proteinTarget: s.proteinTarget ?? '',
    fatTarget: s.fatTarget ?? '',
    carbTarget: s.carbTarget ?? '',
    stepsTarget: s.stepsTarget ?? '',
  }));
  const [toast, setToast] = useState(null);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  };

  const set = (k) => (e) => {
    const v = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const saveProfileSection = () => {
    const next = {
      name: (form.name || '').trim() || s.name,
      startDate: form.startDate || s.startDate,
      endDate: form.endDate || s.endDate,
      startWeight: num(form.startWeight, s.startWeight),
      startBodyFat: num(form.startBodyFat, s.startBodyFat),
      startFatMass: num(form.startFatMass, s.startFatMass),
      startLeanMass: num(form.startLeanMass, s.startLeanMass),
      goalWeight: num(form.goalWeight, s.goalWeight),
      goalBodyFat: num(form.goalBodyFat, s.goalBodyFat),
    };
    patchSettings(next);
    onChange?.();
    flash('Profile saved');
  };

  const saveTargetsSection = () => {
    const next = {
      calorieTarget: num(form.calorieTarget, s.calorieTarget),
      proteinTarget: num(form.proteinTarget, s.proteinTarget),
      fatTarget: num(form.fatTarget, s.fatTarget),
      carbTarget: num(form.carbTarget, s.carbTarget),
      stepsTarget: num(form.stepsTarget, s.stepsTarget),
    };
    patchSettings(next);
    onChange?.();
    flash('Targets saved');
  };

  return (
    <div className="app-shell settings-shell">
      <header className="settings-header">
        <button
          type="button"
          className="ph-icon-btn"
          onClick={onClose}
          aria-label="Back"
          title="Back"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <div className="settings-title">Settings</div>
        <div style={{ width: 36 }} />
      </header>

      <div className="screen settings-screen">
        <Section title="Profile">
          <Field label="Name">
            <input className="auth-input" value={form.name} onChange={set('name')} />
          </Field>
          <Field label="Start date">
            <input type="date" className="auth-input" value={form.startDate} onChange={set('startDate')} />
          </Field>
          <Field label="End date">
            <input type="date" className="auth-input" value={form.endDate} onChange={set('endDate')} />
          </Field>
          <Field label="Start weight (lb)">
            <input type="number" step="0.1" inputMode="decimal" className="auth-input" value={form.startWeight} onChange={set('startWeight')} />
          </Field>
          <Field label="Start body fat %">
            <input type="number" step="0.1" inputMode="decimal" className="auth-input" value={form.startBodyFat} onChange={set('startBodyFat')} />
          </Field>
          <Field label="Start fat mass (lb)">
            <input type="number" step="0.1" inputMode="decimal" className="auth-input" value={form.startFatMass} onChange={set('startFatMass')} />
          </Field>
          <Field label="Start lean mass (lb)">
            <input type="number" step="0.1" inputMode="decimal" className="auth-input" value={form.startLeanMass} onChange={set('startLeanMass')} />
          </Field>
          <Field label="Goal weight (lb)">
            <input type="number" step="0.1" inputMode="decimal" className="auth-input" value={form.goalWeight} onChange={set('goalWeight')} />
          </Field>
          <Field label="Goal body fat %">
            <input type="number" step="0.1" inputMode="decimal" className="auth-input" value={form.goalBodyFat} onChange={set('goalBodyFat')} />
          </Field>
          <div className="section-actions">
            <button type="button" className="btn-primary" onClick={saveProfileSection}>Save profile</button>
          </div>
        </Section>

        <Section title="Targets">
          <Field label="Calories"><input type="number" inputMode="numeric" className="auth-input" value={form.calorieTarget} onChange={set('calorieTarget')} /></Field>
          <Field label="Protein (g)"><input type="number" inputMode="numeric" className="auth-input" value={form.proteinTarget} onChange={set('proteinTarget')} /></Field>
          <Field label="Fat (g)"><input type="number" inputMode="numeric" className="auth-input" value={form.fatTarget} onChange={set('fatTarget')} /></Field>
          <Field label="Carbs (g)"><input type="number" inputMode="numeric" className="auth-input" value={form.carbTarget} onChange={set('carbTarget')} /></Field>
          <Field label="Steps"><input type="number" inputMode="numeric" className="auth-input" value={form.stepsTarget} onChange={set('stepsTarget')} /></Field>
          <div className="section-actions">
            <button type="button" className="btn-primary" onClick={saveTargetsSection}>Save targets</button>
          </div>
        </Section>

        <ProfilesSection onProfileSwitch={onProfileSwitch} onChange={onChange} flash={flash} />

        <SecuritySection onLock={onLock} flash={flash} />

        <DataSection flash={flash} onChange={onChange} />

        <ResetSection profileName={s.name || 'this profile'} onChange={onChange} flash={flash} />
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function num(v, fallback) {
  if (v === '' || v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function Section({ title, children }) {
  return (
    <section className="settings-section">
      <div className="settings-section-title">{title}</div>
      <div className="settings-card">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row-label">{label}</div>
      <div className="settings-row-control">{children}</div>
    </div>
  );
}

/* ---------------- Profiles ---------------- */

function ProfilesSection({ onProfileSwitch, onChange, flash }) {
  const [, setTick] = useState(0);
  const bump = () => setTick((n) => n + 1);
  const cfg = getConfig();
  const ids = cfg?.profiles || [];
  const currentId = cfg?.currentProfile;

  const addProfile = () => {
    const raw = window.prompt('New profile name:');
    if (!raw) return;
    const nm = raw.trim();
    if (!nm) return;
    let id = nm.toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (!id) id = `p${Date.now()}`;
    if (ids.includes(id)) {
      window.alert('A profile with that id already exists.');
      return;
    }
    createProfile(id, nm, { ...ADRIAN_DEFAULTS, name: nm });
    bump();
    onChange?.();
    flash?.('Profile added');
  };

  const removeProfile = (id, nm) => {
    if (ids.length <= 1) {
      window.alert("Can't delete the only profile. Use Reset everything instead.");
      return;
    }
    const ok = window.confirm(`Delete profile "${nm}"? All of its logs, favorites, and settings will be lost.`);
    if (!ok) return;
    deleteProfile(id);
    bump();
    onChange?.();
    flash?.('Profile deleted');
  };

  return (
    <Section title="Profiles">
      {ids.map((id) => {
        const p = getProfile(id);
        const nm = p?.settings?.name || p?.name || id;
        const isCurrent = id === currentId;
        return (
          <div className="settings-row profile-list-row" key={id}>
            <label className="profile-pick">
              <input
                type="radio"
                name="current-profile"
                checked={isCurrent}
                onChange={() => {
                  if (!isCurrent) onProfileSwitch?.(id);
                }}
              />
              <span className="ph-avatar sm">{(nm[0] || '?').toUpperCase()}</span>
              <span className="profile-pick-name">{nm}</span>
              {isCurrent && <span className="profile-pick-badge">Active</span>}
            </label>
            <button
              type="button"
              className="danger-btn sm"
              onClick={() => removeProfile(id, nm)}
              disabled={ids.length <= 1}
              title={ids.length <= 1 ? 'Only profile' : 'Delete profile'}
            >
              Delete
            </button>
          </div>
        );
      })}
      <div className="section-actions">
        <button type="button" className="btn-ghost" onClick={addProfile}>+ Add profile</button>
      </div>
    </Section>
  );
}

/* ---------------- Security ---------------- */

function SecuritySection({ onLock, flash }) {
  const [cur, setCur] = useState('');
  const [n1, setN1] = useState('');
  const [n2, setN2] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const change = async () => {
    setErr(null);
    if (busy) return;
    if (!n1 || n1.length < 4) {
      setErr('New password must be 4+ chars.');
      return;
    }
    if (n1 !== n2) {
      setErr('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const ok = await verifyPassword(cur);
      if (!ok) {
        setErr('Current password incorrect.');
        return;
      }
      await setPassword(n1);
      setCur('');
      setN1('');
      setN2('');
      flash?.('Password updated');
    } catch {
      setErr('Could not change password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="Security">
      <Field label="Current password">
        <input type="password" className="auth-input" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
      </Field>
      <Field label="New password">
        <input type="password" className="auth-input" value={n1} onChange={(e) => setN1(e.target.value)} autoComplete="new-password" />
      </Field>
      <Field label="Confirm new">
        <input type="password" className="auth-input" value={n2} onChange={(e) => setN2(e.target.value)} autoComplete="new-password" />
      </Field>
      {err && <div className="auth-error">{err}</div>}
      <div className="section-actions between">
        <button type="button" className="btn-ghost" onClick={onLock}>Lock now</button>
        <button type="button" className="btn-primary" onClick={change} disabled={busy}>
          {busy ? 'Saving…' : 'Change password'}
        </button>
      </div>
    </Section>
  );
}

/* ---------------- Data ---------------- */

function DataSection({ flash, onChange }) {
  const fileRef = useRef(null);
  const [err, setErr] = useState(null);

  const doExport = () => {
    try {
      const data = exportAll();
      if (!data) return;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `rep-fit-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      flash?.('Exported');
    } catch {
      setErr('Export failed.');
    }
  };

  const onPick = async (e) => {
    setErr(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      importIntoCurrent(json);
      onChange?.();
      flash?.('Imported');
    } catch (ex) {
      setErr(ex?.message || 'Import failed.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Section title="Data">
      <div className="settings-row">
        <div className="settings-row-label">Export JSON</div>
        <div className="settings-row-control">
          <button type="button" className="btn-ghost" onClick={doExport}>Download</button>
        </div>
      </div>
      <div className="settings-row">
        <div className="settings-row-label">Import JSON</div>
        <div className="settings-row-control">
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            onChange={onPick}
            style={{ display: 'none' }}
          />
          <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>
            Choose file…
          </button>
        </div>
      </div>
      {err && <div className="auth-error">{err}</div>}
    </Section>
  );
}

/* ---------------- Reset ---------------- */

function ResetSection({ profileName, onChange, flash }) {
  const [stage, setStage] = useState(null); // 'profile' | 'all' | null
  const [text, setText] = useState('');

  const close = () => {
    setStage(null);
    setText('');
  };

  const confirmProfile = () => {
    if (text.trim().toUpperCase() !== 'CONFIRM') return;
    resetCurrentProfile();
    close();
    onChange?.();
    flash?.('Profile reset');
  };

  const confirmAll = () => {
    if (text.trim().toUpperCase() !== 'CONFIRM') return;
    wipeEverything();
    window.location.reload();
  };

  return (
    <Section title="Reset">
      <div className="settings-row">
        <div className="settings-row-label">
          Reset this profile
          <div className="settings-row-hint">Clears logs, weigh-ins, steps, favorites. Keeps settings.</div>
        </div>
        <div className="settings-row-control">
          <button type="button" className="danger-btn" onClick={() => setStage('profile')}>Reset</button>
        </div>
      </div>
      <div className="settings-row">
        <div className="settings-row-label">
          Reset EVERYTHING
          <div className="settings-row-hint">Wipes all profiles, password, and data on this device.</div>
        </div>
        <div className="settings-row-control">
          <button type="button" className="danger-btn" onClick={() => setStage('all')}>Wipe</button>
        </div>
      </div>

      {stage && (
        <div className="sheet-backdrop" onClick={close}>
          <div className="sheet confirm-sheet" onClick={(e) => e.stopPropagation()}>
            <h2>{stage === 'profile' ? 'Reset this profile?' : 'Wipe everything?'}</h2>
            <div className="hint">
              {stage === 'profile'
                ? `Type CONFIRM to delete all food logs, weigh-ins, steps, and favorites for ${profileName}. Settings are preserved.`
                : 'Type CONFIRM to wipe every profile, the password, and all data on this device. This cannot be undone.'}
            </div>
            <input
              className="auth-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="CONFIRM"
              autoFocus
            />
            <div className="row-btns">
              <button type="button" className="btn-ghost" onClick={close}>Cancel</button>
              <button
                type="button"
                className="danger-btn"
                onClick={stage === 'profile' ? confirmProfile : confirmAll}
                disabled={text.trim().toUpperCase() !== 'CONFIRM'}
              >
                {stage === 'profile' ? 'Reset profile' : 'Wipe everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}
