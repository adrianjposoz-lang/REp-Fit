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
} from 'recharts';

// Weight trend line chart — lazy-loaded so Recharts is only pulled in when rendered.
export default function WeightChart({
  data,
  startWeight,
  goalWeight,
  withLabels = false,
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
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
            (dataMin) =>
              Math.min(goalWeight - 2, Math.floor((dataMin ?? goalWeight) - 1)),
            (dataMax) =>
              Math.max(startWeight + 2, Math.ceil((dataMax ?? startWeight) + 1)),
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
          label={
            withLabels
              ? { value: 'start', fill: '#666', fontSize: 10, position: 'insideTopRight' }
              : undefined
          }
        />
        <ReferenceLine
          y={goalWeight}
          stroke="#22c55e"
          strokeDasharray="3 3"
          label={
            withLabels
              ? { value: 'goal', fill: '#22c55e', fontSize: 10, position: 'insideBottomRight' }
              : undefined
          }
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
          activeDot={withLabels ? { r: 5 } : undefined}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
