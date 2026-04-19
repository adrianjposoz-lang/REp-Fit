import React from 'react';

/**
 * WaterRing — a compact 8-cup tap-target control.
 *
 * Props: { cups, target, onChange }
 *   cups    — current cups logged for the day
 *   target  — goal cups (defaults 8)
 *   onChange(newCups) — called with the clamped new integer value
 *
 * Tapping a cup increments to that cup's count if it's the next unfilled cup,
 * otherwise it toggles that cup off (and everything after). The minus button
 * decrements by 1. Pure SVG droplet icons, no external deps.
 */
export default function WaterRing({ cups = 0, target = 8, onChange }) {
  const safeTarget = Math.max(1, Math.round(Number(target) || 8));
  const current = Math.max(0, Math.round(Number(cups) || 0));

  const set = (n) => {
    if (typeof onChange === 'function') onChange(Math.max(0, Math.round(n)));
  };

  const handleCupTap = (idx) => {
    // idx is 0-based. If cup is already filled, tapping it drops back to idx (unfills this + later).
    // If unfilled, fill up to idx+1.
    const n = idx + 1;
    if (current >= n) {
      set(n - 1);
    } else {
      set(n);
    }
  };

  const cells = Array.from({ length: safeTarget }, (_, i) => i);

  return (
    <div className="water-ring card">
      <div className="water-ring-head">
        <div className="water-ring-title">Water</div>
        <div className="water-ring-count">
          <span className="water-ring-num">{current}</span>
          <span className="water-ring-denom"> of {safeTarget} cups</span>
        </div>
      </div>

      <div
        className="water-ring-cups"
        role="group"
        aria-label="Water cups"
        style={{ gridTemplateColumns: `repeat(${Math.min(safeTarget, 8)}, 1fr)` }}
      >
        {cells.map((i) => {
          const filled = i < current;
          return (
            <button
              key={i}
              type="button"
              className={`water-cup${filled ? ' filled' : ''}`}
              aria-label={`Log cup ${i + 1}`}
              aria-pressed={filled}
              onClick={() => handleCupTap(i)}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path
                  d="M12 2.5c3.5 4.2 6.5 7.9 6.5 11.5a6.5 6.5 0 1 1 -13 0C5.5 10.4 8.5 6.7 12 2.5z"
                  fill={filled ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          );
        })}
      </div>

      <div className="water-ring-actions">
        <button
          type="button"
          className="water-btn"
          onClick={() => set(current - 1)}
          disabled={current <= 0}
          aria-label="Remove one cup"
        >
          −
        </button>
        <button
          type="button"
          className="water-btn"
          onClick={() => set(current + 1)}
          aria-label="Add one cup"
        >
          +
        </button>
      </div>
    </div>
  );
}
