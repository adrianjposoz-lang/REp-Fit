import React, { useState } from 'react';
import { verifyPassword } from '../lib/auth.js';
import { wipeEverything } from '../lib/storage.js';

export default function Login({ onUnlock }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e?.preventDefault?.();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await verifyPassword(pw);
      if (ok) {
        onUnlock();
      } else {
        setError('Incorrect password.');
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const forgot = () => {
    const sure = window.confirm(
      'Forgot password?\n\nThis wipes EVERYTHING on this device: password, profiles, food logs, weigh-ins, steps, favorites — all gone. There is no undo.\n\nContinue?'
    );
    if (!sure) return;
    const double = window.prompt('Type WIPE to confirm full reset:');
    if ((double || '').trim().toUpperCase() !== 'WIPE') return;
    wipeEverything();
    window.location.reload();
  };

  return (
    <div className="screen auth-screen">
      <div className="auth-brand">
        <div className="auth-brand-mark">R</div>
        <div className="auth-brand-text">
          <div className="auth-brand-title">REp Fit</div>
          <div className="auth-brand-sub">Adrian&apos;s cut tracker</div>
        </div>
      </div>

      <form className="card auth-card" onSubmit={submit}>
        <label className="h-label">Password</label>
        <input
          type="password"
          className="auth-input"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="••••••"
          autoFocus
          autoComplete="current-password"
          inputMode="text"
        />
        {error && <div className="auth-error">{error}</div>}
        <button
          type="submit"
          className="btn-primary auth-submit"
          disabled={busy || pw.length === 0}
        >
          {busy ? 'Unlocking…' : 'Unlock'}
        </button>
        <button type="button" className="auth-forgot" onClick={forgot}>
          Forgot password?
        </button>
      </form>

      <div className="auth-footnote">
        Your data stays in this browser. The password is a speed-bump, not bank-grade
        security.
      </div>
    </div>
  );
}
