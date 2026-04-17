import React from 'react';

export default function StatCard({
  label,
  value,
  target,
  unit = '',
  color = 'blue',
  sub,
  over,
  onClick,
  children,
}) {
  const pct = target ? Math.min(100, (Number(value) / Number(target)) * 100) : 0;
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      className={`stat-card${over ? ' over' : ''}`}
      data-color={color}
      onClick={onClick}
    >
      <div className="label">{label}</div>
      {children ? (
        children
      ) : (
        <>
          <div className="value">
            {value}
            {unit && <span style={{ fontSize: '0.5em', marginLeft: 4, color: 'var(--text-secondary)' }}>{unit}</span>}
          </div>
          {sub && <div className="sub">{sub}</div>}
          {target !== undefined && target !== null && (
            <div className="bar">
              <span style={{ width: `${pct}%` }} />
            </div>
          )}
        </>
      )}
    </Comp>
  );
}
