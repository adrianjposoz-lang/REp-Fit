import React, { useMemo } from 'react';
import { lastNDaysKeys, parseKey, formatShortDate } from '../lib/dates.js';
import { totalsForDay } from '../lib/targets.js';

/**
 * ComplianceHeatmap — 7-column grid of last N days.
 * Most recent day is at bottom-right.
 *
 * Color rules:
 *   no log                                                 → gray
 *   |cal - target| <= 100 AND protein >= proTarget - 10    → green
 *   |cal - target| <= 200                                  → amber
 *   otherwise (has log)                                    → red
 */
export default function ComplianceHeatmap({ profile, days = 30 }) {
  const settings = profile?.settings || {};
  const logs = profile?.logs || {};
  const calTarget = Number(settings.calorieTarget) || 0;
  const proTarget = Number(settings.proteinTarget) || 0;

  const cells = useMemo(() => {
    const keys = lastNDaysKeys(days);
    return keys.map((k) => {
      const day = logs[k];
      const t = day ? totalsForDay(day) : null;
      const hasLog = !!day && t && t.calories > 0;
      let cls = 'gray';
      if (hasLog) {
        const calDiff = Math.abs(t.calories - calTarget);
        const proOk = t.protein >= proTarget - 10;
        if (calTarget && calDiff <= 100 && proOk) cls = 'green';
        else if (calTarget && calDiff <= 200) cls = 'amber';
        else cls = 'red';
      }
      const label = formatShortDate(parseKey(k));
      const title = hasLog
        ? `${label} · ${Math.round(t.calories)} kcal · ${Math.round(t.protein)}g protein`
        : `${label} · no log`;
      return { key: k, cls, title };
    });
  }, [logs, days, calTarget, proTarget]);

  // Pad the front so the final cell lands bottom-right of a 7-col grid.
  const cols = 7;
  const pad = (cols - (cells.length % cols)) % cols;

  return (
    <div className="heatmap-wrap">
      <div
        className="heatmap"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: pad }).map((_, i) => (
          <div key={`pad-${i}`} className="heatmap-cell pad" aria-hidden="true" />
        ))}
        {cells.map((c) => (
          <div
            key={c.key}
            className={`heatmap-cell ${c.cls}`}
            title={c.title}
            aria-label={c.title}
          />
        ))}
      </div>
    </div>
  );
}
