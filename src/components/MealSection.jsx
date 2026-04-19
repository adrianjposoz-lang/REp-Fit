import React, { useState } from 'react';
import { MEAL_LABELS } from '../lib/constants.js';
import CopyMenu from './CopyMenu.jsx';

export default function MealSection({
  mealKey,
  foods = [],
  onRemove,
  onAddClick,
  onCopyFromYesterday,
}) {
  const [open, setOpen] = useState(true);
  const total = foods.reduce((s, f) => s + (Number(f.calories) || 0), 0);
  const label = MEAL_LABELS[mealKey] || mealKey;

  return (
    <div className="meal-section">
      <div className="meal-head">
        <button
          className="btn-ghost btn-sm"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          {open ? '▾' : '▸'}
        </button>
        <div className="h-section" style={{ flex: 1 }}>
          {label}
        </div>
        <div className="meal-total">{Math.round(total)} kcal</div>
        {typeof onCopyFromYesterday === 'function' && (
          <CopyMenu
            onCopyMealFromYesterday={() => onCopyFromYesterday(mealKey)}
            mealLabel={label}
          />
        )}
        <button className="btn-add meal-add" onClick={onAddClick}>
          + Add
        </button>
      </div>
      {open && (
        <div className="food-list">
          {foods.length === 0 ? (
            <div className="empty">Nothing logged.</div>
          ) : (
            foods.map((f) => (
              <div key={f.id} className="food-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="name"
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {f.name}
                  </div>
                  <div className="meta">{f.grams ? `${f.grams}g` : ''}</div>
                </div>
                <div className="nutri">
                  <span className="kcal">{Math.round(f.calories)}</span>
                  <span className="prot">{Math.round(f.protein)}g</span>
                </div>
                <button
                  className="icon-btn"
                  onClick={() => onRemove(f.id)}
                  aria-label="Remove"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
