import React from 'react';
import { currentStreak } from '../lib/streaks.js';

export default function StreakBadge({ profile }) {
  const { days, bestEver } = currentStreak(profile);
  if (days < 2) return null;
  return (
    <div className="streak-badge" title={`Best: ${bestEver} days`}>
      <span className="streak-flame">🔥</span>
      <span className="streak-count">{days}</span>
      <span className="streak-label">day streak</span>
    </div>
  );
}
