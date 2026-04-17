import React, { useMemo, useState } from 'react';
import { USER } from '../lib/constants.js';
import {
  dayNumber,
  formatLongDate,
  lastNDaysKeys,
  todayKey,
} from '../lib/dates.js';
import StatCard from '../components/StatCard.jsx';
import { removeFood, setSteps } from '../lib/storage.js';

export default function Today({ logs, onChange, onGo }) {
  const today = todayKey();
  const day = logs[today] || { steps: 0, weight: null, foods: [] };
  const foods = day.foods || [];

  const [editingSteps, setEditingSteps] = useState(false);
  const [stepsDraft, setStepsDraft] = useState(String(day.steps || ''));

  const totals = useMemo(() => {
    return foods.reduce(
      (acc, f) => {
        acc.calories += Number(f.calories) || 0;
        acc.protein += Number(f.protein) || 0;
        return acc;
      },
      { calories: 0, protein: 0 }
    );
  }, [foods]);

  const dayNum = dayNumber();
  const dayDate = new Date();
  const progPct = Math.min(100, (dayNum / USER.programDays) * 100);

  const avg7 = useMemo(() => sevenDayWeight(logs), [logs]);

  const commitSteps = () => {
    setSteps(today, stepsDraft);
    setEditingSteps(false);
    onChange();
  };

  const handleRemove = (id) => {
    removeFood(today, id);
    onChange();
  };

  const calSub =
    totals.calories <= USER.calorieTarget
      ? `${Math.max(0, USER.calorieTarget - Math.round(totals.calories))} kcal left`
      : `+${Math.round(totals.calories - USER.calorieTarget)} over`;
  const proSub =
    totals.protein <= USER.proteinTarget
      ? `${Math.max(0, Math.round(USER.proteinTarget - totals.protein))}g to go`
      : `+${Math.round(totals.protein - USER.proteinTarget)}g over`;
  const stepsSub =
    day.steps >= USER.stepsTarget
      ? 'Goal hit'
      : `${(USER.stepsTarget - (day.steps || 0)).toLocaleString()} to go`;

  return (
    <div className="screen">
      <div className="today-header">
        <div className="h-label">Day {dayNum} of {USER.programDays}</div>
        <div className="day">{USER.name}</div>
        <div className="date">{formatLongDate(dayDate)}</div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progPct}%` }} />
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label="Calories"
          value={Math.round(totals.calories)}
          target={USER.calorieTarget}
          color="amber"
          sub={calSub}
          over={totals.calories > USER.calorieTarget}
          onClick={() => onGo('food')}
        />
        <StatCard
          label="Protein"
          value={`${Math.round(totals.protein)}g`}
          target={USER.proteinTarget}
          color="green"
          sub={proSub}
          onClick={() => onGo('food')}
        />
        <StatCard
          label="Steps"
          value={null}
          color="blue"
          onClick={editingSteps ? undefined : () => setEditingSteps(true)}
        >
          <div className="label">Steps</div>
          {editingSteps ? (
            <input
              className="steps-input-inline"
              type="number"
              inputMode="numeric"
              autoFocus
              value={stepsDraft}
              onChange={(e) => setStepsDraft(e.target.value)}
              onBlur={commitSteps}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitSteps();
                if (e.key === 'Escape') {
                  setStepsDraft(String(day.steps || ''));
                  setEditingSteps(false);
                }
              }}
              style={{ color: 'var(--accent-blue)' }}
            />
          ) : (
            <div className="value" style={{ color: 'var(--accent-blue)' }}>
              {(day.steps || 0).toLocaleString()}
            </div>
          )}
          <div className="sub">{stepsSub}</div>
          <div className="bar">
            <span
              style={{
                width: `${Math.min(100, ((day.steps || 0) / USER.stepsTarget) * 100)}%`,
              }}
            />
          </div>
        </StatCard>
        <StatCard
          label="Weight"
          color="white"
          onClick={undefined}
        >
          <div className="label">Weight</div>
          <div className="value">
            {day.weight != null ? day.weight.toFixed(1) : '—'}
            {day.weight != null && (
              <span style={{ fontSize: '0.4em', marginLeft: 4, color: 'var(--text-secondary)' }}>lbs</span>
            )}
          </div>
          <div className="sub">
            {avg7 ? `7-day avg ${avg7.toFixed(1)} lbs` : 'Log morning weight'}
          </div>
        </StatCard>
      </div>

      <div>
        <div className="h-section" style={{ marginTop: 6, marginBottom: 8 }}>Today's Food</div>
        {foods.length === 0 ? (
          <div className="empty">
            No food logged yet. Tap <b style={{ color: 'var(--text-primary)' }}>Log Food</b> to get started.
          </div>
        ) : (
          <div className="food-list">
            {foods.map((f) => (
              <div key={f.id} className="food-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  <div className="meta">{f.grams}g</div>
                </div>
                <div className="nutri">
                  <span className="kcal">{Math.round(f.calories)}</span>
                  <span className="prot">{Math.round(f.protein)}g</span>
                </div>
                <button
                  className="icon-btn"
                  onClick={() => handleRemove(f.id)}
                  aria-label="Remove"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="fab" onClick={() => onGo('food')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Log Food
      </button>
    </div>
  );
}

function sevenDayWeight(logs) {
  const keys = lastNDaysKeys(7);
  const vals = keys
    .map((k) => logs[k]?.weight)
    .filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
