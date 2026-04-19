import React, { useState } from 'react';

export default function QuickAddSheet({ open, onClose, onConfirm }) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [grams, setGrams] = useState('');

  if (!open) return null;

  const reset = () => {
    setName('');
    setCalories('');
    setProtein('');
    setFat('');
    setCarbs('');
    setGrams('');
  };

  const canSubmit = calories !== '' && protein !== '';

  const submit = () => {
    if (!canSubmit) return;
    onConfirm({
      name: name.trim() || 'Quick add',
      calories: +Number(calories).toFixed(1),
      protein: +Number(protein).toFixed(1),
      fat: +Number(fat || 0).toFixed(1),
      carbs: +Number(carbs || 0).toFixed(1),
      grams: Number(grams || 0),
    });
    reset();
    onClose();
  };

  const close = () => {
    reset();
    onClose();
  };

  const fieldStyle = {
    background: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'center',
    fontSize: 'inherit',
    outline: 'none',
  };

  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>Quick Add</h2>
        <div className="h-label">Name (optional)</div>
        <div className="grams-input">
          <input
            type="text"
            placeholder="Quick add"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="calc-grid" style={{ marginTop: 12 }}>
          <div className="calc-box">
            <div className="k">Cal *</div>
            <input
              className="v"
              type="number"
              inputMode="decimal"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              style={{ ...fieldStyle, color: 'var(--accent-amber)' }}
            />
          </div>
          <div className="calc-box">
            <div className="k">Prot *</div>
            <input
              className="v"
              type="number"
              inputMode="decimal"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              style={{ ...fieldStyle, color: 'var(--accent-green)' }}
            />
          </div>
          <div className="calc-box">
            <div className="k">Fat</div>
            <input
              className="v"
              type="number"
              inputMode="decimal"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              placeholder="0"
              style={{ ...fieldStyle, color: 'var(--accent-cyan)' }}
            />
          </div>
          <div className="calc-box">
            <div className="k">Carb</div>
            <input
              className="v"
              type="number"
              inputMode="decimal"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              placeholder="0"
              style={fieldStyle}
            />
          </div>
        </div>

        <div className="h-label" style={{ marginTop: 12 }}>
          Grams (optional)
        </div>
        <div className="grams-input">
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
          />
          <span className="unit">grams</span>
        </div>

        <div className="row-btns">
          <button className="btn-ghost" onClick={close}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={submit}
            disabled={!canSubmit}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
