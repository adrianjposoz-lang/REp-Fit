import React from 'react';
import {
  estimateTDEE,
  suggestCalorieTarget,
  detectPlateau,
  shouldRefeed,
} from '../lib/coach.js';
import { patchSettings } from '../lib/storage.js';

function latestWeight(profile) {
  const logs = profile?.logs || {};
  const dated = Object.entries(logs)
    .filter(([, v]) => typeof v?.weight === 'number' && !Number.isNaN(v.weight))
    .sort((a, b) => (a[0] < b[0] ? 1 : -1));
  if (dated.length) return dated[0][1].weight;
  const start = Number(profile?.settings?.startWeight);
  return Number.isFinite(start) && start > 0 ? start : null;
}

function fmt(n) {
  if (n == null || !Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString();
}

function signedLbs(x) {
  if (x == null || !Number.isFinite(x)) return '0.0 lb';
  const sign = x < 0 ? '−' : x > 0 ? '+' : '';
  return `${sign}${Math.abs(x).toFixed(1)} lb`;
}

export default function CoachCard({ profile, onChange }) {
  const est = estimateTDEE(profile);

  if (!est) {
    return (
      <div className="card coach-card coach-empty">
        <div className="card-title">Coach</div>
        <div className="coach-sub" style={{ marginTop: 6 }}>
          Log 5+ days of calories and 2+ weigh-ins to unlock your TDEE estimate.
        </div>
      </div>
    );
  }

  const { tdee, avgIntake, weightChange, windowDays } = est;
  const currentWeight = latestWeight(profile);
  const suggested = suggestCalorieTarget(tdee, currentWeight, 0.7);
  const currentTarget = Number(profile?.settings?.calorieTarget) || 0;
  const showApply =
    suggested != null &&
    (!currentTarget || Math.abs(suggested - currentTarget) > 25);

  const plateau = detectPlateau(profile);
  const refeed = shouldRefeed(profile);

  const handleApply = () => {
    if (suggested == null) return;
    patchSettings({ calorieTarget: suggested });
    if (typeof onChange === 'function') onChange();
  };

  return (
    <div className="card coach-card">
      <div className="card-title">Coach · TDEE</div>
      <div className="coach-tdee">
        TDEE · {fmt(tdee)} <span className="coach-tdee-unit">kcal</span>
      </div>
      <div className="coach-sub">
        avg intake {fmt(avgIntake)} · weight change {signedLbs(weightChange)} over {windowDays} d
      </div>

      {suggested != null && (
        <div className="coach-suggest">
          <div className="coach-suggest-text">
            Suggested target:{' '}
            <b>{fmt(suggested)} kcal/day</b>
            <span className="coach-suggest-hint"> · ~0.7%/wk</span>
          </div>
          {showApply && (
            <button className="coach-apply-btn" onClick={handleApply}>
              Apply
            </button>
          )}
        </div>
      )}

      {plateau.plateau && (
        <div className="coach-callout plateau">
          <div className="coach-callout-title">Plateau detected</div>
          <div className="coach-callout-body">{plateau.reason}</div>
        </div>
      )}

      {refeed && (
        <div className="coach-callout refeed">
          <div className="coach-callout-title">Refeed suggested</div>
          <div className="coach-callout-body">
            You've been in a deficit for 10+ consecutive days. A refeed day at
            TDEE (≈ {fmt(tdee)} kcal) may restore leptin and training output.
          </div>
        </div>
      )}
    </div>
  );
}
