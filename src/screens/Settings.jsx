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
import { ADRIAN_DEFAULTS, MEAL_KEYS, MEAL_LABELS } from '../lib/constants.js';
import { todayKey, addDays } from '../lib/dates.js';
import {
  loadHealthConfig,
  saveHealthConfig,
  clearHealthConfig,
  fetchHealthGist,
  mergeHealthIntoProfile,
} from '../lib/healthSync.js';
import { getAIConfig, saveAIConfig } from '../lib/ai.js';

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

  const resetStartToToday = () => {
    const start = todayKey();
    const end = todayKey(addDays(new Date(), 89));
    setForm((f) => ({ ...f, startDate: start, endDate: end }));
    patchSettings({ startDate: start, endDate: end });
    onChange?.();
    flash('Start date reset to today');
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
          <div className="settings-row">
            <div className="settings-row-label">
              Reset to Day 1
              <div className="settings-row-hint">Starts a fresh 90-day window from today. Keeps all existing logs.</div>
            </div>
            <div className="settings-row-control">
              <button type="button" className="btn-ghost" onClick={resetStartToToday}>Reset</button>
            </div>
          </div>
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

        <MealLabelsSection profile={profile} onChange={onChange} flash={flash} />

        <HealthSyncSection onChange={onChange} flash={flash} />

        <AISection flash={flash} />

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

/* ---------------- Meal labels ---------------- */

function MealLabelsSection({ profile, onChange, flash }) {
  const existing = profile?.settings?.mealLabels || {};
  const [labels, setLabels] = useState(() => {
    const init = {};
    for (const k of MEAL_KEYS) {
      init[k] = existing[k] || '';
    }
    return init;
  });

  const update = (k) => (e) => {
    const v = e?.target ? e.target.value : e;
    setLabels((l) => ({ ...l, [k]: v }));
  };

  const save = () => {
    const next = {};
    for (const k of MEAL_KEYS) {
      const v = (labels[k] || '').trim();
      if (v && v !== MEAL_LABELS[k]) next[k] = v;
    }
    patchSettings({ mealLabels: next });
    onChange?.();
    flash?.('Meal labels saved');
  };

  return (
    <Section title="Meal labels">
      <div className="label-editor">
        {MEAL_KEYS.map((k) => (
          <div className="settings-row" key={k}>
            <div className="settings-row-label">
              {MEAL_LABELS[k]}
              <div className="settings-row-hint">
                Leave blank to use the default label.
              </div>
            </div>
            <div className="settings-row-control">
              <input
                className="auth-input"
                placeholder={MEAL_LABELS[k]}
                value={labels[k]}
                onChange={update(k)}
                maxLength={24}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="section-actions">
        <button type="button" className="btn-primary" onClick={save}>
          Save labels
        </button>
      </div>
    </Section>
  );
}

/* ---------------- Apple Health sync ---------------- */

function HealthSyncSection({ onChange, flash }) {
  const [cfg, setCfg] = useState(() => loadHealthConfig() || { gistId: '', token: '', autoSync: true });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  const save = () => {
    const next = {
      gistId: (cfg.gistId || '').trim(),
      token: (cfg.token || '').trim(),
      autoSync: !!cfg.autoSync,
      lastSyncedAt: cfg.lastSyncedAt,
    };
    saveHealthConfig(next);
    setCfg(next);
    flash?.('Sync settings saved');
  };

  const disconnect = () => {
    if (!window.confirm('Disconnect Apple Health sync? Your data stays — this just forgets the gist + token.')) return;
    clearHealthConfig();
    setCfg({ gistId: '', token: '', autoSync: true });
    flash?.('Disconnected');
  };

  const syncNow = async () => {
    setErr(null);
    setBusy(true);
    try {
      const current = loadHealthConfig();
      if (!current?.gistId) {
        setErr('Save your gist ID first.');
        return;
      }
      const payload = await fetchHealthGist(current.gistId, current.token);
      const p = getProfile();
      if (!p) {
        setErr('No active profile.');
        return;
      }
      const { touched } = mergeHealthIntoProfile(p, payload);
      // Persist via saveProfile flow — reuse storage API indirectly:
      // We mutated `p` in place; the getProfile() call returns the live parsed
      // object, so we need to write it back.
      const cfgAll = getConfig();
      if (cfgAll?.currentProfile) {
        localStorage.setItem(`rep_fit:profile:${cfgAll.currentProfile}`, JSON.stringify(p));
      }
      const next = { ...current, lastSyncedAt: Date.now() };
      saveHealthConfig(next);
      setCfg(next);
      onChange?.();
      flash?.(touched > 0 ? `Synced · ${touched} day${touched === 1 ? '' : 's'} updated` : 'Already up to date');
    } catch (e) {
      setErr(e?.message || 'Sync failed.');
    } finally {
      setBusy(false);
    }
  };

  const lastSynced = cfg.lastSyncedAt
    ? new Date(cfg.lastSyncedAt).toLocaleString()
    : '—';
  const connected = !!cfg.gistId;

  return (
    <Section title="Apple Health sync">
      <div className="settings-row">
        <div className="settings-row-label">
          Gist ID
          <div className="settings-row-hint">Paste the ID from your private gist URL.</div>
        </div>
        <div className="settings-row-control">
          <input
            className="auth-input"
            placeholder="e.g. 8f4c…e21"
            value={cfg.gistId || ''}
            onChange={(e) => setCfg((c) => ({ ...c, gistId: e.target.value }))}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="settings-row">
        <div className="settings-row-label">
          GitHub token
          <div className="settings-row-hint">Needed only for private gists. Token stays on this device; never exported.</div>
        </div>
        <div className="settings-row-control">
          <input
            className="auth-input"
            placeholder="github_pat_…"
            type="password"
            value={cfg.token || ''}
            onChange={(e) => setCfg((c) => ({ ...c, token: e.target.value }))}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="settings-row">
        <div className="settings-row-label">
          Auto-sync on open
          <div className="settings-row-hint">Pulls latest data each time you unlock.</div>
        </div>
        <div className="settings-row-control">
          <label className="switch">
            <input
              type="checkbox"
              checked={!!cfg.autoSync}
              onChange={(e) => setCfg((c) => ({ ...c, autoSync: e.target.checked }))}
            />
            <span>Enabled</span>
          </label>
        </div>
      </div>

      <div className="settings-row">
        <div className="settings-row-label">Last synced</div>
        <div className="settings-row-control settings-row-muted">{lastSynced}</div>
      </div>

      {err && <div className="auth-error">{err}</div>}

      <div className="section-actions between">
        <button type="button" className="btn-ghost" onClick={() => setShowHelp((s) => !s)}>
          {showHelp ? 'Hide setup guide' : 'Show setup guide'}
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {connected && (
            <button type="button" className="danger-btn sm" onClick={disconnect}>
              Disconnect
            </button>
          )}
          <button type="button" className="btn-ghost" onClick={save}>
            Save
          </button>
          <button type="button" className="btn-primary" onClick={syncNow} disabled={busy || !cfg.gistId}>
            {busy ? 'Syncing…' : 'Sync now'}
          </button>
        </div>
      </div>

      {showHelp && <HealthSyncHelp />}
    </Section>
  );
}

function HealthSyncHelp() {
  return (
    <div className="sync-help">
      <h3>One-time setup (~10 min)</h3>
      <ol>
        <li>
          <b>Make a private gist.</b> Go to <code>gist.github.com</code> → new gist →
          filename <code>repfit.json</code> → content <code>{'{"days":{}}'}</code> →
          click <b>Create secret gist</b>. Copy the ID from the URL (the long hash after
          your username).
        </li>
        <li>
          <b>Create a token.</b> <code>github.com/settings/tokens</code> → Generate new
          token → <b>Fine-grained</b>. Repository access: <i>None</i>. Permissions:
          <b> Gists</b> → Read &amp; write. Copy the token.
        </li>
        <li>
          <b>Paste ID + token</b> into the fields above → Save.
        </li>
        <li>
          <b>Build the Shortcut</b> on iPhone (Shortcuts app → +):
          <ul>
            <li>Get Health Sample: Step Count · yesterday.</li>
            <li>Get Health Sample: Active Energy · yesterday.</li>
            <li>Get Health Sample: Weight · latest.</li>
            <li>Get Text from JSON template with keys: <code>steps</code>, <code>activeKcal</code>, <code>weight</code>, <code>workouts</code>. Wrap in <code>{'{"days":{"YYYY-MM-DD":{…}}}'}</code>.</li>
            <li>Get Contents of URL: <code>PATCH https://api.github.com/gists/YOUR_ID</code> · Headers: <code>Authorization: Bearer YOUR_TOKEN</code> · Body: <code>{'{"files":{"repfit.json":{"content":"…"}}}'}</code></li>
          </ul>
        </li>
        <li>
          <b>Automation</b> (optional): Shortcuts → Automation → Time of Day → 6 AM daily → run your shortcut. Data appears in REp-Fit each morning.
        </li>
      </ol>
      <p className="hint">
        Tip: the gist content just needs a top-level <code>days</code> object keyed by
        <code>YYYY-MM-DD</code>. Any fields the app doesn't recognize are ignored.
      </p>
    </div>
  );
}

/* ---------------- AI features ---------------- */

function AISection({ flash }) {
  const [cfg, setCfg] = useState(() => getAIConfig());
  const [showKey, setShowKey] = useState(false);

  const save = () => {
    const next = {
      ...cfg,
      apiKey: (cfg.apiKey || '').trim(),
      enabled: !!cfg.enabled,
    };
    saveAIConfig(next);
    setCfg(next);
    flash?.('AI settings saved');
  };

  const disconnect = () => {
    if (!window.confirm('Remove API key? AI features will be disabled.')) return;
    const next = { apiKey: '', enabled: false, lastCoach: cfg.lastCoach };
    saveAIConfig(next);
    setCfg(next);
    flash?.('AI disconnected');
  };

  const connected = !!(cfg.apiKey && cfg.apiKey.startsWith('sk-'));

  return (
    <Section title="AI features">
      <p className="settings-row-hint" style={{ marginTop: 0 }}>
        Enable natural-language food entry, photo meal-logging, and a weekly AI coach recap. Uses your own Anthropic API key (Claude Haiku 4.5 ~ $0.50-2/mo typical).
      </p>

      <div className="settings-row">
        <div className="settings-row-label">
          Anthropic API key
          <div className="settings-row-hint">
            Create at console.anthropic.com → API keys. Set a $5/mo spend limit. Stays on this device; never exported.
          </div>
        </div>
        <div className="settings-row-control">
          <input
            className="auth-input"
            type={showKey ? 'text' : 'password'}
            placeholder="sk-ant-…"
            value={cfg.apiKey || ''}
            onChange={(e) => setCfg((c) => ({ ...c, apiKey: e.target.value }))}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setShowKey((v) => !v)}
            style={{ marginTop: 6 }}
          >
            {showKey ? 'Hide' : 'Show'} key
          </button>
        </div>
      </div>

      <div className="settings-row">
        <div className="settings-row-label">
          Enable AI features
          <div className="settings-row-hint">Master switch for all AI calls.</div>
        </div>
        <div className="settings-row-control">
          <label className="switch">
            <input
              type="checkbox"
              checked={!!cfg.enabled}
              onChange={(e) => setCfg((c) => ({ ...c, enabled: e.target.checked }))}
            />
            <span>{cfg.enabled ? 'On' : 'Off'}</span>
          </label>
        </div>
      </div>

      <div className="section-actions">
        <button type="button" className="btn-primary" onClick={save}>Save</button>
        {connected && (
          <button type="button" className="btn-ghost" onClick={disconnect}>Remove key</button>
        )}
      </div>

      {connected && cfg.enabled && (
        <p className="settings-row-hint" style={{ marginTop: 12 }}>
          ✓ Connected. Look for the ✨ AI button on Food and a coach card on Analytics.
        </p>
      )}
    </Section>
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
