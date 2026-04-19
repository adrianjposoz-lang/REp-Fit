import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  programDays,
  rawDayNumber,
  sevenDayWeight,
  estimatedBodyFat,
  totalsForDay,
} from '../lib/targets.js';
import { formatShortDate, lastNDaysKeys, parseKey } from '../lib/dates.js';
import ComplianceHeatmap from '../components/ComplianceHeatmap.jsx';

export default function Analytics({ profile }) {
  const settings = profile?.settings || {};
  const logs = profile?.logs || {};

  const progN = programDays(settings);
  const rawDayN = Math.max(1, rawDayNumber(settings));
  const overGoal = rawDayN > progN ? rawDayN - progN : 0;

  const startWeight = Number(settings.startWeight) || 0;
  const goalWeight = Number(settings.goalWeight) || 0;
  const calorieTarget = Number(settings.calorieTarget) || 0;
  const proteinTarget = Number(settings.proteinTarget) || 0;
  const fatTarget = Number(settings.fatTarget) || 0;
  const carbTarget = Number(settings.carbTarget) || 0;
  const stepsTarget = Number(settings.stepsTarget) || 0;

  const weightHistory = useMemo(() => buildHistory(logs), [logs]);
  const avg7 = useMemo(() => sevenDayWeight(profile), [profile]);
  const current = avg7 ?? startWeight;
  const lost = startWeight - current;
  const lossPerDay = rawDayN > 0 ? lost / rawDayN : 0;
  const projected = lossPerDay * progN;
  const targetLoss = startWeight - goalWeight;
  const expectedLoss = progN > 0 ? (targetLoss / progN) * rawDayN : 0;

  let status = 'on';
  let statusText = 'On Track';
  if (lost < expectedLoss - 1) {
    status = 'behind';
    statusText = 'Behind';
  } else if (lost > expectedLoss + 1) {
    status = 'ahead';
    statusText = 'Ahead';
  }

  const currentBF = estimatedBodyFat(profile, current) ?? settings.startBodyFat ?? 0;
  const goalBF = Number(settings.goalBodyFat) || 20;
  const bfToGoal = currentBF - goalBF;

  const weekly = useMemo(() => sevenDayStats(logs), [logs]);
  const last14 = useMemo(() => buildDailyStats(logs, 14), [logs]);

  const milestones = [
    { id: 'd1', icon: '🚀', text: 'Day 1 — Started the program', unlocked: rawDayN >= 1 },
    { id: 'lb10', icon: '💪', text: '-10 lbs lost', unlocked: lost >= 10 },
    { id: 'lb20', icon: '🔥', text: '-20 lbs lost', unlocked: lost >= 20 },
    { id: 'bf30', icon: '📉', text: 'Below 30% body fat', unlocked: currentBF < 30 },
    { id: 'bf25', icon: '⚡', text: 'Below 25% body fat', unlocked: currentBF < 25 },
    {
      id: 'bfgoal',
      icon: '🏆',
      text: `Below ${goalBF}% body fat (goal)`,
      unlocked: currentBF < goalBF,
    },
    { id: 'dGoal', icon: '🎯', text: `Day ${progN} — Complete`, unlocked: rawDayN >= progN },
  ];

  return (
    <div className="screen">
      <div className="today-header">
        <div className="h-label">Analytics</div>
        <div className="day" style={{ fontSize: 28 }}>Progress</div>
      </div>

      <div className="card">
        <div className="progress-header">
          <div>
            <div className="h-label">
              Day {rawDayN} of {progN}
              {overGoal > 0 && (
                <span style={{ color: 'var(--accent-green)' }}> · +{overGoal} past goal</span>
              )}
            </div>
            <div className="num-md" style={{ marginTop: 6 }}>
              {lost >= 0 ? '−' : '+'}{Math.abs(lost).toFixed(1)} lbs
            </div>
          </div>
          <div className={`status ${status}`}>{statusText}</div>
        </div>
        <div className="progress-track" style={{ marginTop: 12 }}>
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, (rawDayN / progN) * 100)}%` }}
          />
        </div>
        <div className="progress-row">
          <div className="kv-box">
            <div className="k">Start → Now</div>
            <div className="v">{startWeight.toFixed(1)} → {current.toFixed(1)}</div>
          </div>
          <div className="kv-box">
            <div className="k">Projected loss</div>
            <div className="v">{projected.toFixed(1)} lbs</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Body Fat Estimate</div>
        <div className="progress-row" style={{ marginTop: 0 }}>
          <div className="kv-box">
            <div className="k">Current BF%</div>
            <div className="v" style={{ color: 'var(--accent-amber)' }}>{currentBF.toFixed(1)}%</div>
          </div>
          <div className="kv-box">
            <div className="k">To {goalBF}% Goal</div>
            <div className="v">{bfToGoal > 0 ? bfToGoal.toFixed(1) : '0.0'}%</div>
          </div>
        </div>
        <div className="hint" style={{ marginTop: 10 }}>
          Start: {settings.startBodyFat}% · Fat mass {settings.startFatMass} lbs · Lean {settings.startLeanMass} lbs. Assumes lean mass is preserved.
        </div>
      </div>

      <div className="card">
        <div className="card-title">Weekly Averages (7 days)</div>
        <div className="weekly-grid">
          <div className="kv-box">
            <div className="k">Calories</div>
            <div className={`v ${calColor(weekly.calories, calorieTarget)}`}>
              {Math.round(weekly.calories)}
            </div>
            <div className="hint" style={{ marginTop: 4 }}>target {calorieTarget}</div>
          </div>
          <div className="kv-box">
            <div className="k">Protein</div>
            <div className={`v ${proColor(weekly.protein, proteinTarget)}`}>
              {Math.round(weekly.protein)}g
            </div>
            <div className="hint" style={{ marginTop: 4 }}>target {proteinTarget}g</div>
          </div>
          <div className="kv-box">
            <div className="k">Fat</div>
            <div className={`v ${rangeColor(weekly.fat, fatTarget, 15)}`}>
              {Math.round(weekly.fat)}g
            </div>
            <div className="hint" style={{ marginTop: 4 }}>target {fatTarget}g</div>
          </div>
          <div className="kv-box">
            <div className="k">Carbs</div>
            <div className={`v ${rangeColor(weekly.carbs, carbTarget, 30)}`}>
              {Math.round(weekly.carbs)}g
            </div>
            <div className="hint" style={{ marginTop: 4 }}>target {carbTarget}g</div>
          </div>
          <div className="kv-box">
            <div className="k">Steps</div>
            <div className={`v ${stepColor(weekly.steps, stepsTarget)}`}>
              {Math.round(weekly.steps).toLocaleString()}
            </div>
            <div className="hint" style={{ marginTop: 4 }}>target {stepsTarget.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Weight Trend</div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightHistory} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#1a1a1a" strokeDasharray="2 3" vertical={false} />
              <XAxis dataKey="label" stroke="#555" tick={{ fill: '#777', fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis
                domain={[
                  (dataMin) => Math.min(goalWeight - 2, Math.floor((dataMin ?? goalWeight) - 1)),
                  (dataMax) => Math.max(startWeight + 2, Math.ceil((dataMax ?? startWeight) + 1)),
                ]}
                stroke="#555"
                tick={{ fill: '#777', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip contentStyle={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#888' }} />
              <ReferenceLine y={startWeight} stroke="#444" strokeDasharray="3 3" />
              <ReferenceLine y={goalWeight} stroke="#22c55e" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Calories & Protein (14 days)</div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={last14} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#1a1a1a" strokeDasharray="2 3" vertical={false} />
              <XAxis dataKey="label" stroke="#555" tick={{ fill: '#777', fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={20} />
              <YAxis yAxisId="left" stroke="#f59e0b" tick={{ fill: '#777', fontSize: 10 }} axisLine={false} tickLine={false} width={34} />
              <YAxis yAxisId="right" orientation="right" stroke="#22c55e" tick={{ fill: '#777', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#888' }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />
              <ReferenceLine yAxisId="left" y={calorieTarget} stroke="#f59e0b" strokeDasharray="3 3" />
              <ReferenceLine yAxisId="right" y={proteinTarget} stroke="#22c55e" strokeDasharray="3 3" />
              <Line yAxisId="left" name="kcal" type="monotone" dataKey="calories" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line yAxisId="right" name="protein" type="monotone" dataKey="protein" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Macros Breakdown (14 days)</div>
        <div className="chart-wrap chart-small">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last14} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#1a1a1a" strokeDasharray="2 3" vertical={false} />
              <XAxis dataKey="label" stroke="#555" tick={{ fill: '#777', fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={20} />
              <YAxis stroke="#555" tick={{ fill: '#777', fontSize: 10 }} axisLine={false} tickLine={false} width={34} />
              <Tooltip contentStyle={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#888' }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />
              <Bar dataKey="protein" stackId="m" fill="#22c55e" name="P" />
              <Bar dataKey="fat" stackId="m" fill="#f59e0b" name="F" />
              <Bar dataKey="carbs" stackId="m" fill="#3b82f6" name="C" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Steps (14 days)</div>
        <div className="chart-wrap chart-small">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last14} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#1a1a1a" strokeDasharray="2 3" vertical={false} />
              <XAxis dataKey="label" stroke="#555" tick={{ fill: '#777', fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={20} />
              <YAxis stroke="#555" tick={{ fill: '#777', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#888' }} />
              <ReferenceLine y={stepsTarget} stroke="#3b82f6" strokeDasharray="3 3" />
              <Bar dataKey="steps" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Compliance heatmap — last 30 days</div>
        <ComplianceHeatmap profile={profile} days={30} />
        <div className="heatmap-legend">
          <span className="legend-item"><span className="legend-dot green" /> on target</span>
          <span className="legend-item"><span className="legend-dot amber" /> close</span>
          <span className="legend-item"><span className="legend-dot red" /> off</span>
          <span className="legend-item"><span className="legend-dot gray" /> no log</span>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Milestones</div>
        <div className="milestones">
          {milestones.map((m) => (
            <div key={m.id} className={`milestone ${m.unlocked ? 'unlocked' : 'locked'}`}>
              <span className="icon">{m.unlocked ? m.icon : '🔒'}</span>
              <span className="text">{m.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildHistory(logs) {
  return Object.entries(logs)
    .filter(([, v]) => typeof v.weight === 'number' && !Number.isNaN(v.weight))
    .map(([date, v]) => ({
      date,
      weight: v.weight,
      label: formatShortDate(parseKey(date)),
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

function sevenDayStats(logs) {
  const keys = lastNDaysKeys(7);
  let cal = 0, pro = 0, fat = 0, carbs = 0, steps = 0, days = 0;
  keys.forEach((k) => {
    const d = logs[k];
    if (!d) return;
    const t = totalsForDay(d);
    cal += t.calories;
    pro += t.protein;
    fat += t.fat;
    carbs += t.carbs;
    steps += Number(d.steps) || 0;
    days += 1;
  });
  const n = Math.max(1, days);
  return {
    calories: cal / n,
    protein: pro / n,
    fat: fat / n,
    carbs: carbs / n,
    steps: steps / n,
  };
}

function buildDailyStats(logs, n) {
  return lastNDaysKeys(n).map((k) => {
    const d = logs[k];
    const t = d ? totalsForDay(d) : { calories: 0, protein: 0, fat: 0, carbs: 0 };
    return {
      date: k,
      label: formatShortDate(parseKey(k)),
      calories: Math.round(t.calories),
      protein: Math.round(t.protein),
      fat: Math.round(t.fat),
      carbs: Math.round(t.carbs),
      steps: Number(d?.steps) || 0,
    };
  });
}

function calColor(v, t) {
  if (!t || v === 0) return '';
  if (v <= t + 50) return 'good';
  if (v <= t + 200) return 'warn';
  return 'bad';
}
function proColor(v, t) {
  if (!t || v === 0) return '';
  if (v >= t - 10) return 'good';
  if (v >= t - 30) return 'warn';
  return 'bad';
}
function stepColor(v, t) {
  if (!t || v === 0) return '';
  if (v >= t) return 'good';
  if (v >= t * 0.7) return 'warn';
  return 'bad';
}
function rangeColor(v, t, tol) {
  if (!t || v === 0) return '';
  const d = Math.abs(v - t);
  if (d <= tol) return 'good';
  if (d <= tol * 2) return 'warn';
  return 'bad';
}
