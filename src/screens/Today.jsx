import React, { useEffect, useMemo, useState } from 'react';
import StatCard from '../components/StatCard.jsx';
import ActivityRings from '../components/ActivityRings.jsx';
import DateNavigator from '../components/DateNavigator.jsx';
import MealSection from '../components/MealSection.jsx';
import MacroDonut from '../components/MacroDonut.jsx';
import WaterRing from '../components/WaterRing.jsx';
import CopyMenu from '../components/CopyMenu.jsx';
import CardioSheet from '../components/CardioSheet.jsx';
import StreakBadge from '../components/StreakBadge.jsx';
import { MEAL_KEYS, MICRO_KEYS, MICRO_LABELS, MICRO_UNITS } from '../lib/constants.js';
import {
  getDay,
  removeFoodFromMeal,
  setSteps,
  setWater,
  setNotes,
  copyDayMeals,
  copyMealToDate,
} from '../lib/storage.js';
import { addDays, parseKey, todayKey } from '../lib/dates.js';
import {
  programDays,
  rawDayNumber,
  sevenDayWeight,
  totalsForDay,
} from '../lib/targets.js';

function defaultMealForNow(now = new Date()) {
  const h = now.getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h < 20) return 'dinner';
  return 'snacks';
}

export default function Today({ profile, date, onChange, onDateChange, onGo }) {
  const settings = profile?.settings || {};
  const day = useMemo(() => getDay(date), [date, profile]);
  const totals = useMemo(() => totalsForDay(day), [day]);

  const [editingSteps, setEditingSteps] = useState(false);
  const [stepsDraft, setStepsDraft] = useState(String(day.steps || ''));
  const [notesDraft, setNotesDraft] = useState(day.notes || '');
  const [showCardio, setShowCardio] = useState(false);

  // Keep notes draft in sync when the underlying date or profile changes.
  useEffect(() => {
    setNotesDraft(day.notes || '');
  }, [date, day.notes]);

  const rawN = Math.max(1, rawDayNumber(settings));
  const progN = programDays(settings);
  const overGoal = rawN > progN ? rawN - progN : 0;
  const progPct = Math.min(100, (rawN / progN) * 100);

  const avg7 = useMemo(() => sevenDayWeight(profile), [profile, date]);

  const commitSteps = () => {
    setSteps(date, stepsDraft);
    setEditingSteps(false);
    onChange();
  };

  const handleRemove = (mealKey, id) => {
    removeFoodFromMeal(date, mealKey, id);
    onChange();
  };

  const yesterdayKey = useMemo(
    () => todayKey(addDays(parseKey(date), -1)),
    [date]
  );

  const handleCopyYesterday = () => {
    copyDayMeals(yesterdayKey, date);
    onChange();
  };

  const handleCopyMealFromYesterday = (mealKey) => {
    copyMealToDate(yesterdayKey, mealKey, date);
    onChange();
  };

  const handleWaterChange = (cups) => {
    setWater(date, cups);
    onChange();
  };

  const commitNotes = () => {
    setNotes(date, notesDraft);
    onChange();
  };

  const calTarget = settings.calorieTarget || 0;
  const proTarget = settings.proteinTarget || 0;
  const fatTarget = settings.fatTarget || 0;
  const carbTarget = settings.carbTarget || 0;
  const stepTarget = settings.stepsTarget || 0;
  const waterTarget = settings.waterTarget || 8;

  const calSub =
    totals.calories <= calTarget
      ? `${Math.max(0, calTarget - Math.round(totals.calories))} kcal left`
      : `+${Math.round(totals.calories - calTarget)} over`;
  const proSub =
    totals.protein <= proTarget
      ? `${Math.max(0, Math.round(proTarget - totals.protein))}g to go`
      : `+${Math.round(totals.protein - proTarget)}g over`;
  const stepsSub =
    (day.steps || 0) >= stepTarget
      ? 'Goal hit'
      : `${Math.max(0, stepTarget - (day.steps || 0)).toLocaleString()} to go`;

  const kcalLeft = Math.max(0, calTarget - Math.round(totals.calories));
  const kcalOver = Math.round(totals.calories) > calTarget;
  const proLeft = Math.max(0, Math.round(proTarget - totals.protein));
  const weightDisplay = day.weight != null ? day.weight.toFixed(1) : '—';

  const hasAnyLogs = !!(profile?.logs && Object.keys(profile.logs).length > 0);
  const isFirstRun = !hasAnyLogs;

  return (
    <div className="screen">
      <div className="today-hero">
        <div className="today-hero-cell">
          <div className="today-hero-label">{kcalOver ? 'Over' : 'Kcal left'}</div>
          <div className={`today-hero-value${kcalOver ? ' over' : ''}`}>
            {kcalOver ? `+${Math.round(totals.calories) - calTarget}` : kcalLeft}
          </div>
        </div>
        <div className="today-hero-divider" />
        <div className="today-hero-cell">
          <div className="today-hero-label">Protein to go</div>
          <div className="today-hero-value green">{proLeft}<span className="today-hero-unit">g</span></div>
        </div>
        <div className="today-hero-divider" />
        <div className="today-hero-cell">
          <div className="today-hero-label">Weight</div>
          <div className="today-hero-value">
            {weightDisplay}
            {day.weight != null && <span className="today-hero-unit">lb</span>}
          </div>
        </div>
      </div>

      {isFirstRun && (
        <div className="welcome-card">
          <div className="welcome-title">Welcome to REp-Fit</div>
          <div className="welcome-copy">
            Two taps to get rolling: log your first meal and set today's weight. Everything else unlocks from there.
          </div>
          <div className="welcome-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => onGo('food', { date })}
            >
              Log a meal
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => onGo('weight')}
            >
              Log weight
            </button>
          </div>
        </div>
      )}

      <div className="today-header">
        <div className="h-label">
          Day {rawN} of {progN}
          {overGoal > 0 && (
            <span style={{ color: 'var(--accent-green)' }}> · +{overGoal} past goal</span>
          )}
        </div>
        <div className="day">{settings.name || profile?.name || 'Today'}</div>
        <StreakBadge profile={profile} />
        <DateNavigator
          date={date}
          onChange={onDateChange}
          startDate={settings.startDate}
        />
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progPct}%` }} />
        </div>
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'center' }}>
        <ActivityRings
          size={180}
          centerLabel={`${Math.round(totals.calories)}`}
          centerSub="kcal"
          rings={[
            { label: 'Calories', color: 'amber', value: totals.calories, target: calTarget },
            { label: 'Protein', color: 'green', value: totals.protein, target: proTarget },
            { label: 'Steps', color: 'blue', value: day.steps || 0, target: stepTarget },
          ]}
        />
      </div>

      <div className="stat-grid">
        <StatCard
          label="Calories"
          value={Math.round(totals.calories)}
          target={calTarget}
          color="amber"
          sub={calSub}
          over={totals.calories > calTarget}
          onClick={() => onGo('food', { date })}
        />
        <StatCard
          label="Protein"
          value={`${Math.round(totals.protein)}g`}
          target={proTarget}
          color="green"
          sub={proSub}
          onClick={() => onGo('food', { date })}
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
                width: `${Math.min(100, ((day.steps || 0) / (stepTarget || 1)) * 100)}%`,
              }}
            />
          </div>
        </StatCard>
        <StatCard label="Weight" color="white" onClick={() => onGo('weight')}>
          <div className="label">Weight</div>
          <div className="value">
            {day.weight != null ? day.weight.toFixed(1) : '—'}
            {day.weight != null && (
              <span style={{ fontSize: '0.4em', marginLeft: 4, color: 'var(--text-secondary)' }}>
                lbs
              </span>
            )}
          </div>
          <div className="sub">
            {avg7 ? `7-day avg ${avg7.toFixed(1)} lbs` : 'Log morning weight'}
          </div>
        </StatCard>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="card-title" style={{ alignSelf: 'flex-start' }}>Macros</div>
        <MacroDonut
          protein={totals.protein}
          fat={totals.fat}
          carbs={totals.carbs}
        />
        <div className="hint" style={{ marginTop: 8 }}>
          Target · P {proTarget}g · F {fatTarget}g · C {carbTarget}g
        </div>
        {(totals.fiber > 0 || totals.sugar > 0 || totals.sodium > 0) && (
          <div className="micros-row" style={{ marginTop: 10 }}>
            {MICRO_KEYS.map((k) => {
              const v = Number(totals[k]) || 0;
              const display =
                MICRO_UNITS[k] === 'mg' ? Math.round(v) : v.toFixed(1);
              return (
                <span key={k} className="micro-chip">
                  <b>{MICRO_LABELS[k]}</b> {display}
                  {MICRO_UNITS[k]}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <WaterRing
        cups={day.water || 0}
        target={waterTarget}
        onChange={handleWaterChange}
      />

      <div className="meals-header">
        <div className="card-title" style={{ margin: 0 }}>Meals</div>
        <CopyMenu
          onCopyYesterday={handleCopyYesterday}
        />
      </div>

      {MEAL_KEYS.map((k) => (
        <MealSection
          key={k}
          mealKey={k}
          profile={profile}
          foods={day.meals?.[k] || []}
          onRemove={(id) => handleRemove(k, id)}
          onAddClick={() => onGo('food', { mealKey: k, date })}
          onCopyFromYesterday={handleCopyMealFromYesterday}
        />
      ))}

      <div className="card training-card">
        <div className="card-title">Training</div>
        <div className="training-summary">
          {(() => {
            const nW = (day.workouts || []).length;
            const minC = (day.cardio || []).reduce(
              (s, c) => s + (Number(c.minutes) || 0),
              0
            );
            return (
              <span>
                {nW} {nW === 1 ? 'workout' : 'workouts'} · {minC} min cardio
              </span>
            );
          })()}
        </div>
        <div className="training-actions">
          <button
            className="btn-ghost"
            onClick={() => onGo('workouts')}
          >
            Open Train
          </button>
          <button
            className="btn-ghost"
            onClick={() => setShowCardio((s) => !s)}
          >
            {showCardio ? 'Close cardio' : 'Log cardio'}
          </button>
        </div>
        {showCardio && (
          <CardioSheet
            date={date}
            onLogged={() => {
              onChange();
            }}
          />
        )}
      </div>

      <div className="card notes-card">
        <div className="card-title">Notes</div>
        <textarea
          className="notes-input"
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          onBlur={commitNotes}
          placeholder="How did today feel?"
          maxLength={2000}
          rows={4}
        />
        <div className="hint" style={{ marginTop: 6 }}>
          {notesDraft.length} / 2000
        </div>
      </div>

      <button
        className="fab"
        onClick={() => onGo('food', { mealKey: defaultMealForNow(), date })}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Log Food
      </button>

    </div>
  );
}
