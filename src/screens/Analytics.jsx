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
import { USER } from '../lib/constants.js';
import {
  dayNumber,
  formatShortDate,
  lastNDaysKeys,
  parseKey,
  rawDayNumber,
} from '../lib/dates.js';

export default function Analytics({ logs }) {
  const dayN = dayNumber();
  const rawDayN = Math.max(1, rawDayNumber());

  const weightHistory = useMemo(() => buildHistory(logs), [logs]);
  const avg7 = useMemo(() => sevenDayAvg(logs), [logs]);
  const current = avg7 ?? USER.startWeight;
  const lost = USER.startWeight - current;
  const lossPerDay = lost / rawDayN;
  const projected = lossPerDay * USER.programDays;
  const targetLoss = USER.startWeight - USER.goalWeight;
  const expectedLoss = (targetLoss / USER.programDays) * rawDayN;

  let status = 'on';
  let statusText = 'On Track';
  if (lost < expectedLoss - 1) {
    status = 'behind';
    statusText = 'Behind';
  } else if (lost > expectedLoss + 1) {
    status = 'ahead';
    statusText = 'Ahead';
  }

  const currentFatMass = Math.max(0, USER.startFatMass - lost);
  const currentBF = current > 0 ? (currentFatMass / current) * 100 : USER.startBodyFat;
  const bfToGoal = currentBF - USER.goalBodyFat;

  const weekly = useMemo(() => sevenDayStats(logs), [logs]);

  const last14 = useMemo(() => buildDailyStats(logs, 14), [logs]);

  const milestones = [
    { id: 'd1', icon: '🚀', text: 'Day 1 — Started the program', unlocked: rawDayN >= 1 },
    { id: 'lb10', icon: '💪', text: '-10 lbs lost', unlocked: lost >= 10 },
    { id: 'lb20', icon: '🔥', text: '-20 lbs lost', unlocked: lost >= 20 },
    { id: 'bf30', icon: '📉', text: 'Below 30% body fat', unlocked: currentBF < 30 },
    { id: 'bf25', icon: '⚡', text: 'Below 25% body fat', unlocked: currentBF < 25 },
    { id: 'bf20', icon: '🏆', text: 'Below 20% body fat (abs territory)', unlocked: currentBF < 20 },
    { id: 'd90', icon: '🎯', text: 'Day 90 — Complete', unlocked: rawDayN >= USER.programDays },
  ];

  return (
    <div className="screen">
      <div className="today-header">
        <div className="h-label">Analytics</div>
        <div className="day" style={{ fontSize: 28 }}>90-Day Progress</div>
      </div>

      <div className="card">
        <div className="progress-header">
          <div>
            <div className="h-label">Day {dayN} of {USER.programDays}</div>
            <div className="num-md" style={{ marginTop: 6 }}>
              {lost >= 0 ? '−' : '+'}{Math.abs(lost).toFixed(1)} lbs
            </div>
          </div>
          <div className={`status ${status}`}>{statusText}</div>
        </div>
        <div className="progress-track" style={{ marginTop: 12 }}>
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, (dayN / USER.programDays) * 100)}%` }}
          />
        </div>
        <div className="progress-row">
          <div className="kv-box">
            <div className="k">Start → Now</div>
            <div className="v">{USER.startWeight.toFixed(1)} → {current.toFixed(1)}</div>
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
            <div className="k">To 20% Goal</div>
            <div className="v">{bfToGoal > 0 ? bfToGoal.toFixed(1) : '0.0'}%</div>
          </div>
        </div>
        <div className="hint" style={{ marginTop: 10 }}>
          Start: {USER.startBodyFat}% · Fat mass {USER.startFatMass} lbs · Lean {USER.startLeanMass} lbs. Assumes lean mass is preserved.
        </div>
      </div>

      <div className="card">
        <div className="card-title">Weekly Averages (7 days)</div>
        <div className="weekly-grid">
          <div className="kv-box">
            <div className="k">Calories</div>
            <div className={`v ${calColor(weekly.calories, USER.calorieTarget)}`}>{Math.round(weekly.calories)}</div>
            <div className="hint" style={{ marginTop: 4 }}>target {USER.calorieTarget}</div>
          </div>
          <div className="kv-box">
            <div className="k">Protein</div>
            <div className={`v ${proColor(weekly.protein, USER.proteinTarget)}`}>{Math.round(weekly.protein)}g</div>
            <div className="hint" style={{ marginTop: 4 }}>target {USER.proteinTarget}g</div>
          </div>
          <div className="kv-box">
            <div className="k">Steps</div>
            <div className={`v ${stepColor(weekly.steps, USER.stepsTarget)}`}>{Math.round(weekly.steps).toLocaleString()}</div>
            <div className="hint" style={{ marginTop: 4 }}>target {USER.stepsTarget.toLocaleString()}</div>
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
                  (dataMin) => Math.min(USER.goalWeight - 2, Math.floor((dataMin ?? USER.goalWeight) - 1)),
                  (dataMax) => Math.max(USER.startWeight + 2, Math.ceil((dataMax ?? USER.startWeight) + 1)),
                ]}
                stroke="#555"
                tick={{ fill: '#777', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip contentStyle={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#888' }} />
              <ReferenceLine y={USER.startWeight} stroke="#444" strokeDasharray="3 3" />
              <ReferenceLine y={USER.goalWeight} stroke="#22c55e" strokeDasharray="3 3" />
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
              <ReferenceLine yAxisId="left" y={USER.calorieTarget} stroke="#f59e0b" strokeDasharray="3 3" />
              <ReferenceLine yAxisId="right" y={USER.proteinTarget} stroke="#22c55e" strokeDasharray="3 3" />
              <Line yAxisId="left" name="kcal" type="monotone" dataKey="calories" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line yAxisId="right" name="protein" type="monotone" dataKey="protein" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
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
              <ReferenceLine y={USER.stepsTarget} stroke="#3b82f6" strokeDasharray="3 3" />
              <Bar dataKey="steps" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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

function sevenDayAvg(logs) {
  const keys = lastNDaysKeys(7);
  const vals = keys
    .map((k) => logs[k]?.weight)
    .filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (vals.length === 0) {
    const anyWeights = Object.values(logs)
      .map((v) => v.weight)
      .filter((v) => typeof v === 'number' && !Number.isNaN(v));
    if (anyWeights.length === 0) return null;
    return anyWeights[anyWeights.length - 1];
  }
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function sevenDayStats(logs) {
  const keys = lastNDaysKeys(7);
  let cal = 0, pro = 0, steps = 0, days = 0;
  keys.forEach((k) => {
    const d = logs[k];
    if (!d) return;
    const dayCal = (d.foods || []).reduce((s, f) => s + (Number(f.calories) || 0), 0);
    const dayPro = (d.foods || []).reduce((s, f) => s + (Number(f.protein) || 0), 0);
    cal += dayCal;
    pro += dayPro;
    steps += Number(d.steps) || 0;
    days += 1;
  });
  const n = Math.max(1, days);
  return { calories: cal / n, protein: pro / n, steps: steps / n };
}

function buildDailyStats(logs, n) {
  return lastNDaysKeys(n).map((k) => {
    const d = logs[k] || { foods: [], steps: 0 };
    const calories = (d.foods || []).reduce((s, f) => s + (Number(f.calories) || 0), 0);
    const protein = (d.foods || []).reduce((s, f) => s + (Number(f.protein) || 0), 0);
    return {
      date: k,
      label: formatShortDate(parseKey(k)),
      calories: Math.round(calories),
      protein: Math.round(protein),
      steps: Number(d.steps) || 0,
    };
  });
}

function calColor(v, t) {
  if (v === 0) return '';
  if (v <= t + 50) return 'good';
  if (v <= t + 200) return 'warn';
  return 'bad';
}
function proColor(v, t) {
  if (v === 0) return '';
  if (v >= t - 10) return 'good';
  if (v >= t - 30) return 'warn';
  return 'bad';
}
function stepColor(v, t) {
  if (v === 0) return '';
  if (v >= t) return 'good';
  if (v >= t * 0.7) return 'warn';
  return 'bad';
}
