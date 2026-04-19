import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

// Daily-steps bar chart (14 days).
export default function StepsChart({ data, stepsTarget }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="#1a1a1a" strokeDasharray="2 3" vertical={false} />
        <XAxis dataKey="label" stroke="#555" tick={{ fill: '#777', fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={20} />
        <YAxis stroke="#555" tick={{ fill: '#777', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip contentStyle={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#888' }} />
        <ReferenceLine y={stepsTarget} stroke="#3b82f6" strokeDasharray="3 3" />
        <Bar dataKey="steps" fill="#3b82f6" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
