import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

// Stacked macros bar chart (14 days).
export default function MacrosStacked({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
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
  );
}
