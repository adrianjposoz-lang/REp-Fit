import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { getDay, setWeight } from '../lib/storage.js';
import { sevenDayWeight } from '../lib/targets.js';
import { formatShortDate, parseKey } from '../lib/dates.js';
import DateNavigator from '../components/DateNavigator.jsx';
import Body from './Body.jsx';
import { MEASUREMENT_KEYS, MEASUREMENT_LABELS } from '../lib/constants.js';

function latestMeasurements(profile) {
  const out = {};
  const logs = profile?.logs || {};
  const keys = Object.keys(logs).sort().reverse();
  const need = new Set(MEASUREMENT_KEYS);
  for (const k of keys) {
    if (need.size === 0) break;
    const m = logs[k]?.measurements;
    if (!m) continue;
    for (const key of Array.from(need)) {
      if (m[key] != null && m[key] !== '' && !Number.isNaN(Number(m[key]))) {
        out[key] = { value: Number(m[key]), date: k };
        need.delete(key);
      }
    }
  }
  return out;
}

export default function Weight({ profile, date, onChange, onDateChange }) {
  const settings = profile?.settings || {};
  const startWeight = Number(settings.startWeight) || 0;
  const goalWeight = Number(settings.goalWeight) || 0;

  const day = useMemo(() => getDay(date), [date, profile]);
  const currentW = day.weight ?? '';
  const [draft, setDraft] = useState(currentW === null ? '' : String(currentW));

  React.useEffect(() => {
    setDraft(day.weight == null ? '' : String(day.weight));
  }, [date, day.weight]);

  const save = () => {
    setWeight(date, draft === '' ? null : draft);
    onChange?.();
  };

  const logs = profile?.logs || {};
  const history = useMemo(() => buildHistory(logs), [logs]);
  const avg7 = useMemo(() => sevenDayWeight(profile), [profile]);
  const latestM = useMemo(() => latestMeasurements(profile), [profile]);
  const [showBody, setShowBody] = useState(false);

  const deltaFromStart = avg7 != null ? avg7 - startWeight : null;

  return (
    <div className="screen">
      <div className="today-header">
        <div className="h-label">Morning Weigh-In</div>
        <div className="day" style={{ fontSize: 28 }}>Weight</div>
        {onDateChange && (
          <DateNavigator
            date={date}
            onChange={onDateChange}
            startDate={settings.startDate}
          />
        )}
      </div>

      <div className="card">
        <div className="weight-big">
          <div className="weight-input">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={draft}
              placeholder="0.0"
              onChange={(e) => setDraft(e.target.value)}
            />
            <span className="unit">lbs</span>
          </div>
          <div className="hint">
            Log first thing in the morning, after bathroom, before eating.
          </div>
          <button className="btn-primary" onClick={save} style={{ marginTop: 8 }}>
            Save Weight
          </button>
        </div>
      </div>

      <div className="avg-row">
        <div className="card avg-box">
          <div className="h-label">7-Day Avg</div>
          <div className="value" style={{ marginTop: 8 }}>
            {avg7 != null ? avg7.toFixed(1) : '—'}
            <span style={{ fontSize: 12, marginLeft: 6, color: 'var(--text-secondary)' }}>lbs</span>
          </div>
          {deltaFromStart != null && (
            <div
              className={`delta ${deltaFromStart <= 0 ? 'down' : 'up'}`}
              style={{ fontSize: 12, marginTop: 6 }}
            >
              {deltaFromStart <= 0 ? '▼' : '▲'} {Math.abs(deltaFromStart).toFixed(1)} lbs from start
            </div>
          )}
        </div>
        <div className="card avg-box">
          <div className="h-label">To Goal</div>
          <div className="value" style={{ marginTop: 8 }}>
            {avg7 != null ? (avg7 - goalWeight).toFixed(1) : (startWeight - goalWeight).toFixed(1)}
            <span style={{ fontSize: 12, marginLeft: 6, color: 'var(--text-secondary)' }}>lbs</span>
          </div>
          <div style={{ fontSize: 12, marginTop: 6, color: 'var(--text-secondary)' }}>
            target {goalWeight} lbs
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Weight History</div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#1a1a1a" strokeDasharray="2 3" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#555"
                tick={{ fill: '#777', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                domain={[
                  (dataMin) => Math.min(goalWeight - 2, Math.floor(dataMin - 1)),
                  (dataMax) => Math.max(startWeight + 2, Math.ceil(dataMax + 1)),
                ]}
                stroke="#555"
                tick={{ fill: '#777', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: '#0f0f0f',
                  border: '1px solid #222',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#888' }}
              />
              <ReferenceLine
                y={startWeight}
                stroke="#444"
                strokeDasharray="3 3"
                label={{ value: 'start', fill: '#666', fontSize: 10, position: 'insideTopRight' }}
              />
              <ReferenceLine
                y={goalWeight}
                stroke="#22c55e"
                strokeDasharray="3 3"
                label={{ value: 'goal', fill: '#22c55e', fontSize: 10, position: 'insideBottomRight' }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {history.length === 0 && (
          <div className="empty" style={{ marginTop: 6 }}>Log a weight to see your trend.</div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Body Measurements</div>
        {Object.keys(latestM).length === 0 ? (
          <div className="empty" style={{ marginTop: 6 }}>
            No measurements logged yet.
          </div>
        ) : (
          <div className="measurement-grid" style={{ marginBottom: 12 }}>
            {MEASUREMENT_KEYS.map((k) => {
              const m = latestM[k];
              return (
                <div key={k} className="measurement-summary">
                  <div className="measurement-summary-label">
                    {MEASUREMENT_LABELS[k]}
                  </div>
                  <div className="measurement-summary-value">
                    {m ? m.value : '—'}
                    {m && <span className="measurement-summary-unit">in</span>}
                  </div>
                  <div className="measurement-summary-date">
                    {m ? formatShortDate(parseKey(m.date)) : 'No log'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <button
          className="btn-ghost"
          onClick={() => setShowBody(true)}
          style={{ width: '100%' }}
        >
          + Log measurements
        </button>
      </div>

      <div className="card">
        <div className="card-title">Log</div>
        <div className="log-table">
          <div className="row head">
            <div>Date</div>
            <div>Weight</div>
            <div>Change</div>
          </div>
          {history.length === 0 ? (
            <div className="empty" style={{ marginTop: 6 }}>No weigh-ins yet.</div>
          ) : (
            [...history].reverse().map((h, i, arr) => {
              const prev = arr[i + 1];
              const change = prev ? h.weight - prev.weight : null;
              return (
                <div className="row" key={h.date}>
                  <div>{h.label}</div>
                  <div className="wval">{h.weight.toFixed(1)} lbs</div>
                  <div
                    className={
                      change == null ? '' : change < 0 ? 'delta down' : change > 0 ? 'delta up' : ''
                    }
                  >
                    {change == null
                      ? '—'
                      : `${change > 0 ? '+' : ''}${change.toFixed(1)}`}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showBody && (
        <Body
          date={date}
          profile={profile}
          onClose={() => setShowBody(false)}
          onChange={onChange}
        />
      )}
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
