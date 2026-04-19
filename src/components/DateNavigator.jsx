import React from 'react';
import {
  addDays,
  formatLongDate,
  isSameDay,
  parseKey,
  todayKey,
} from '../lib/dates.js';

function toKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function DateNavigator({ date, onChange, startDate }) {
  const selected = parseKey(date);
  const today = parseKey(todayKey());
  const yesterday = addDays(today, -1);

  const isToday = isSameDay(selected, today);
  const isYesterday = isSameDay(selected, yesterday);

  const label = isToday
    ? 'Today'
    : isYesterday
    ? 'Yesterday'
    : formatLongDate(selected);

  const atStart = !!(startDate && date === startDate);

  const goPrev = () => {
    if (atStart) return;
    onChange(toKey(addDays(selected, -1)));
  };
  const goNext = () => {
    if (isToday) return;
    onChange(toKey(addDays(selected, 1)));
  };

  return (
    <div className="date-nav">
      <button
        className="arrow"
        onClick={goPrev}
        disabled={atStart}
        aria-label="Previous day"
      >
        ‹
      </button>
      <div className="center">{label}</div>
      <button
        className="arrow"
        onClick={goNext}
        disabled={isToday}
        aria-label="Next day"
      >
        ›
      </button>
    </div>
  );
}
