import React, { useState } from 'react';
import { getAIConfig, generateWeeklyCoach, hasAIKey } from '../lib/ai.js';
import { getProfile } from '../lib/storage.js';

export default function AICoachCard({ profile: propProfile }) {
  const [cfg, setCfg] = useState(() => getAIConfig());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  if (!hasAIKey()) return null;

  const regen = async () => {
    setErr(null);
    setBusy(true);
    try {
      const profile = propProfile || getProfile();
      await generateWeeklyCoach(profile);
      setCfg(getAIConfig());
    } catch (e) {
      setErr(e?.message || 'Failed to generate');
    } finally {
      setBusy(false);
    }
  };

  const last = cfg.lastCoach;
  const ageDays = last ? Math.floor((Date.now() - new Date(last.at).getTime()) / 86400000) : null;

  return (
    <div className="ai-coach-card card">
      <div className="ai-coach-head">
        <div className="ai-coach-title">✨ AI Coach</div>
        <button className="btn-ghost ai-coach-regen" onClick={regen} disabled={busy}>
          {busy ? <><span className="spinner" /> Thinking…</> : last ? 'Refresh' : 'Generate'}
        </button>
      </div>
      {err && <div className="error">{err}</div>}
      {last ? (
        <>
          <div className="ai-coach-text">{last.text}</div>
          <div className="ai-coach-meta">
            {ageDays === 0 ? 'Today' : ageDays === 1 ? 'Yesterday' : `${ageDays} days ago`}
          </div>
        </>
      ) : (
        <div className="ai-coach-empty">
          Tap Generate for a personalized 7-day recap from Claude.
        </div>
      )}
    </div>
  );
}
