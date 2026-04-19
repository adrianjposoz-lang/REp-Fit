import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

// Calories + protein dual-axis line chart (14 days).
export default function CaloriesChart({ data, calorieTarget, proteinTarget }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
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
  );
}
