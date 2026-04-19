import React, { useMemo, useState } from 'react';
import { MEAL_KEYS, MEAL_LABELS, SERVING_UNITS } from '../lib/constants.js';
import { toGrams, scaleNutrients } from '../lib/servings.js';
import { addFoodToMeal, addRecent } from '../lib/storage.js';

// QuickAddSheet: logs a specific food to a meal with a serving-unit picker.
// API: { food, mealKey, date, onClose, onLogged }
//   food: { fdcId?, id?, name, per100g, gramsPerUnit? }
//   mealKey: initial meal (user can change inside sheet)
//   date: YYYY-MM-DD string to log against
//   onClose(): close without logging
//   onLogged(entry, mealKey): fired after successful log
export default function QuickAddSheet({ food, mealKey, date, onClose, onLogged }) {
  if (!food) return null;

  const [meal, setMeal] = useState(mealKey || 'lunch');
  const [unit, setUnit] = useState('g');
  const [amount, setAmount] = useState('100');

  const per = food.per100g || { calories: 0, protein: 0, fat: 0, carbs: 0 };
  const grams = useMemo(
    () => toGrams(amount, unit, food.gramsPerUnit),
    [amount, unit, food.gramsPerUnit]
  );
  const calc = useMemo(() => scaleNutrients(per, grams), [per, grams]);

  const canSubmit = Number(amount) > 0 && grams > 0;

  const submit = () => {
    if (!canSubmit) return;
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fdcId: food.fdcId,
      name: food.name,
      grams: +grams.toFixed(1),
      unit,
      amount: Number(amount),
      calories: calc.calories,
      protein: calc.protein,
      fat: calc.fat,
      carbs: calc.carbs,
    };
    addFoodToMeal(date, meal, entry);
    if (food.fdcId) {
      addRecent({ fdcId: food.fdcId, name: food.name, per100g: per });
    }
    onLogged?.(entry, meal);
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>{food.name}</h2>

        <div className="h-label">Meal</div>
        <div className="meal-picker">
          {MEAL_KEYS.map((k) => (
            <button
              key={k}
              className={`meal-pill${meal === k ? ' active' : ''}`}
              onClick={() => setMeal(k)}
              type="button"
            >
              {MEAL_LABELS[k]}
            </button>
          ))}
        </div>

        <div className="h-label" style={{ marginTop: 6 }}>Unit</div>
        <div className="unit-picker">
          {SERVING_UNITS.map((u) => {
            const disabled = u.id === 'piece' && !food.gramsPerUnit;
            return (
              <button
                key={u.id}
                type="button"
                className={`unit-pill${unit === u.id ? ' active' : ''}`}
                onClick={() => !disabled && setUnit(u.id)}
                disabled={disabled}
                title={disabled ? 'Set grams-per-piece on this food to enable' : ''}
              >
                {u.label}
              </button>
            );
          })}
        </div>

        <div className="h-label" style={{ marginTop: 6 }}>Amount</div>
        <div className="grams-input">
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            autoFocus
            onChange={(e) => setAmount(e.target.value)}
          />
          <span className="unit">
            {unit === 'g' ? 'grams' : unit}
            {unit !== 'g' && grams ? ` · ${grams.toFixed(1)}g` : ''}
          </span>
        </div>

        <div className="calc-grid">
          <div className="calc-box">
            <div className="k">Cal</div>
            <div className="v" style={{ color: 'var(--accent-amber)' }}>
              {Math.round(calc.calories)}
            </div>
          </div>
          <div className="calc-box">
            <div className="k">Prot</div>
            <div className="v" style={{ color: 'var(--accent-green)' }}>
              {calc.protein.toFixed(1)}
            </div>
          </div>
          <div className="calc-box">
            <div className="k">Fat</div>
            <div className="v" style={{ color: 'var(--accent-cyan)' }}>
              {calc.fat.toFixed(1)}
            </div>
          </div>
          <div className="calc-box">
            <div className="k">Carb</div>
            <div className="v">{calc.carbs.toFixed(1)}</div>
          </div>
        </div>

        <div className="row-btns">
          <button className="btn-ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={submit}
            disabled={!canSubmit}
            type="button"
          >
            Log Food
          </button>
        </div>
      </div>
    </div>
  );
}
