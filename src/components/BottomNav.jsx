import React from 'react';

const TABS = [
  { id: 'today', label: 'Today', icon: TodayIcon },
  { id: 'food', label: 'Food', icon: FoodIcon },
  { id: 'workouts', label: 'Train', icon: TrainIcon },
  { id: 'weight', label: 'Weight', icon: WeightIcon },
  { id: 'analytics', label: 'Stats', icon: StatsIcon },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      <div className="row">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              className={isActive ? 'active' : ''}
              onClick={() => onChange(t.id)}
              aria-label={t.label}
            >
              <span className="nav-icon-wrap">
                <Icon active={isActive} />
              </span>
              <span className="nav-label">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function TodayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18M8 2v4M16 2v4" />
    </svg>
  );
}

function FoodIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2v9a3 3 0 0 0 6 0V2M9 2v20M16 3c-1 0-3 1-3 5 0 3 2 4 3 4v10" />
    </svg>
  );
}

function WeightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 7v6l3 2" />
      <path d="M9 3h6" />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 3 3 5-6" />
    </svg>
  );
}

function TrainIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h2M20 12h2M5 7v10M19 7v10M8 9v6M16 9v6M8 12h8" />
    </svg>
  );
}
