import React, { useState } from 'react';
import { CARDIO_TYPES } from '../lib/constants.js';
import { addCardio } from '../lib/storage.js';

export default function CardioSheet({ date, onLogged }) {
  const [type, setType] = useState(CARDIO_TYPES[0]);
  const [minutes, setMinutes] = useState('');
  const [calories, setCalories] = useState('');

  const canLog = Number(minutes) > 0;

  const submit = () => {
    if (!canLog) return;
    const payload = {
      type,
      minutes: Number(minutes),
    };
    const kcal = Number(calories);
    if (kcal > 0) payload.calories = kcal;
    addCardio(date, payload);
    setMinutes('');
    setCalories('');
    setType(CARDIO_TYPES[0]);
    onLogged?.();
  };

  return (
    <div className="cardio-sheet">
      <div className="card-title">Log cardio</div>
      <div className="cardio-types">
        {CARDIO_TYPES.map((t) => (
          <button
            key={t}
            className={`cardio-pill ${t === type ? 'active' : ''}`}
            onClick={() => setType(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="cardio-inputs">
        <label className="cardio-input-wrap">
          <span>Minutes</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            placeholder="0"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
        </label>
        <label className="cardio-input-wrap">
          <span>kcal (optional)</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            placeholder="—"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
          />
        </label>
      </div>
      <button
        className="btn-primary"
        onClick={submit}
        disabled={!canLog}
      >
        Log
      </button>
    </div>
  );
}
