import React, { useState } from 'react';
import { MEAL_LABELS, mealLabelFor } from '../lib/constants.js';
import CopyMenu from './CopyMenu.jsx';
import { addUsualMeal } from '../lib/storage.js';
import { todayKey } from '../lib/dates.js';

export default function MealSection({
  mealKey,
  foods = [],
  onRemove,
  onAddClick,
  onCopyFromYesterday,
  profile,
  onAfterSaveUsual,
}) {
  const [open, setOpen] = useState(true);
  const [savingUsual, setSavingUsual] = useState(false);
  const [usualName, setUsualName] = useState('');
  const [inlineFeedback, setInlineFeedback] = useState('');
  const total = foods.reduce((s, f) => s + (Number(f.calories) || 0), 0);
  const label = profile
    ? mealLabelFor(profile, mealKey)
    : MEAL_LABELS[mealKey] || mealKey;

  const openSaveUsual = () => {
    setUsualName(`${label} · ${todayKey()}`);
    setInlineFeedback('');
    setSavingUsual(true);
  };

  const cancelSaveUsual = () => {
    setSavingUsual(false);
    setUsualName('');
  };

  const confirmSaveUsual = () => {
    const name = usualName.trim();
    if (!name || foods.length === 0) {
      setInlineFeedback(
        foods.length === 0 ? 'Nothing logged yet.' : 'Give it a name.'
      );
      return;
    }
    const items = foods.map((f) => ({
      name: f.name,
      calories: Number(f.calories) || 0,
      protein: Number(f.protein) || 0,
      fat: Number(f.fat) || 0,
      carbs: Number(f.carbs) || 0,
      fiber: Number(f.fiber) || 0,
      sugar: Number(f.sugar) || 0,
      sodium: Number(f.sodium) || 0,
    }));
    addUsualMeal({ name, mealKey, items });
    setSavingUsual(false);
    setUsualName('');
    setInlineFeedback('');
    if (typeof onAfterSaveUsual === 'function') {
      onAfterSaveUsual(name);
    } else {
      // Inline confirmation when no parent toast is wired up.
      setInlineFeedback(`Saved "${name}" as a usual.`);
      setTimeout(() => setInlineFeedback(''), 1800);
    }
  };

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
        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={openSaveUsual}
          disabled={foods.length === 0 || savingUsual}
          title="Save as my usual"
          aria-label="Save as my usual"
        >
          ☆+
        </button>
        <button className="btn-add meal-add" onClick={onAddClick}>
          + Add
        </button>
      </div>

      {savingUsual && (
        <div className="save-usual-inline">
          <input
            type="text"
            value={usualName}
            onChange={(e) => setUsualName(e.target.value)}
            placeholder="Name this usual"
            autoFocus
          />
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={cancelSaveUsual}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={confirmSaveUsual}
          >
            Save
          </button>
        </div>
      )}

      {inlineFeedback && !savingUsual && (
        <div className="hint" style={{ marginTop: 4 }}>
          {inlineFeedback}
        </div>
      )}

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
