import React from 'react';

export default function MacroDonut({ protein = 0, fat = 0, carbs = 0, size = 120 }) {
  const pKcal = protein * 4;
  const fKcal = fat * 9;
  const cKcal = carbs * 4;
  const total = pKcal + fKcal + cKcal;

  const strokeWidth = Math.max(10, Math.round(size / 10));
  const r = size / 2 - strokeWidth / 2 - 2;
  const circ = 2 * Math.PI * r;

  const pPct = total > 0 ? pKcal / total : 0;
  const fPct = total > 0 ? fKcal / total : 0;
  const cPct = total > 0 ? cKcal / total : 0;

  const arcs = [
    { color: '#22c55e', pct: pPct, offset: 0 },
    { color: '#f59e0b', pct: fPct, offset: pPct },
    { color: '#3b82f6', pct: cPct, offset: pPct + fPct },
  ];

  return (
    <div className="macro-donut-wrap">
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="#1a1a1a"
              strokeWidth={strokeWidth}
            />
            {total > 0 &&
              arcs.map((a, i) => (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={a.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circ * a.pct} ${circ}`}
                  strokeDashoffset={-circ * a.offset}
                />
              ))}
          </g>
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: Math.round(size / 7), fontWeight: 700 }}>
            {Math.round(total)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>kcal</div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 8,
          flexWrap: 'wrap',
          justifyContent: 'center',
          fontSize: 12,
        }}
      >
        <LegendDot color="#22c55e" label={`P ${Math.round(pPct * 100)}%`} />
        <LegendDot color="#f59e0b" label={`F ${Math.round(fPct * 100)}%`} />
        <LegendDot color="#3b82f6" label={`C ${Math.round(cPct * 100)}%`} />
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          background: color,
          display: 'inline-block',
        }}
      />
      {label}
    </span>
  );
}
