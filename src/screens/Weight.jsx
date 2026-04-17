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
import { USER } from '../lib/constants.js';
import { setWeight } from '../lib/storage.js';
import { formatShortDate, parseKey, todayKey } from '../lib/dates.js';

export default function Weight({ logs, onChange }) {
  const today = todayKey();
  const todayW = logs[today]?.weight ?? '';
  const [draft, setDraft] = useState(todayW === null ? '' : String(todayW));

  const save = () => {
    setWeight(today, draft === '' ? null : draft);
    onChange();
  };

  const history = useMemo(() => buildHistory(logs), [logs]);
  const avg7 = useMemo(() => sevenDayAvg(logs), [logs]);

  const deltaFromStart = avg7 != null ? avg7 - USER.startWeight : null;

  return (
    <div className="screen">
      <div className="today-header">
        <div className="h-label">Morning Weigh-In</div>
        <div className="day" style={{ fontSize: 28 }}>Today</div>
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
            {avg7 != null ? (avg7 - USER.goalWeight).toFixed(1) : (USER.startWeight - USER.goalWeight).toFixed(1)}
            <span style={{ fontSize: 12, marginLeft: 6, color: 'var(--text-secondary)' }}>lbs</span>
          </div>
          <div style={{ fontSize: 12, marginTop: 6, color: 'var(--text-secondary)' }}>
            target {USER.goalWeight} lbs
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
                  (dataMin) => Math.min(USER.goalWeight - 2, Math.floor(dataMin - 1)),
                  (dataMax) => Math.max(USER.startWeight + 2, Math.ceil(dataMax + 1)),
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
              <ReferenceLine y={USER.startWeight} stroke="#444" strokeDasharray="3 3" label={{ value: 'start', fill: '#666', fontSize: 10, position: 'insideTopRight' }} />
              <ReferenceLine y={USER.goalWeight} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'goal', fill: '#22c55e', fontSize: 10, position: 'insideBottomRight' }} />
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
    </div>
  );
}

function buildHistory(logs) {
  const rows = Object.entries(logs)
    .filter(([, v]) => typeof v.weight === 'number' && !Number.isNaN(v.weight))
    .map(([date, v]) => ({
      date,
      weight: v.weight,
      label: formatShortDate(parseKey(date)),
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  return rows;
}

function sevenDayAvg(logs) {
  const rows = Object.entries(logs)
    .filter(([, v]) => typeof v.weight === 'number' && !Number.isNaN(v.weight))
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, 7);
  if (rows.length === 0) return null;
  return rows.reduce((s, [, v]) => s + v.weight, 0) / rows.length;
}
