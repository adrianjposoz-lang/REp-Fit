import React from 'react';

const COLOR_MAP = {
  amber: '#f59e0b',
  green: '#22c55e',
  blue: '#3b82f6',
};

export default function ActivityRings({
  rings = [],
  size = 180,
  centerLabel,
  centerSub,
}) {
  const strokeWidth = Math.max(8, Math.round(size / 14));
  const gap = 4;
  const outerR = size / 2 - strokeWidth / 2 - 2;

  return (
    <div className="rings-wrap" style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((r, i) => {
          const radius = outerR - i * (strokeWidth + gap);
          if (radius < strokeWidth) return null;
          const circ = 2 * Math.PI * radius;
          const ratio = r.target > 0 ? r.value / r.target : 0;
          const clamped = Math.min(ratio, 1.2);
          const dash = circ * clamped;
          const color = COLOR_MAP[r.color] || r.color || '#3b82f6';
          const reached = ratio >= 1;
          return (
            <g
              key={r.label || i}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={reached ? { filter: `drop-shadow(0 0 4px ${color})` } : undefined}
            >
              <circle
                className="ring"
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeOpacity="0.18"
                strokeWidth={strokeWidth}
              />
              <circle
                className="ring"
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`}
              />
            </g>
          );
        })}
      </svg>
      {(centerLabel || centerSub) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {centerLabel && (
            <div style={{ fontSize: Math.round(size / 7), fontWeight: 700 }}>
              {centerLabel}
            </div>
          )}
          {centerSub && (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {centerSub}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
