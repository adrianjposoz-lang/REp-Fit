import React, { useMemo, useState } from 'react';
import { bestLift, estimate1RM } from '../lib/coach.js';

export default function ExerciseCard({ exercise, onChange, onRemove, profile }) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(exercise.name || '');

  const best = useMemo(
    () => (exercise.name ? bestLift(profile, exercise.name) : null),
    [profile, exercise.name]
  );

  const sets = Array.isArray(exercise.sets) ? exercise.sets : [];

  const heaviest = useMemo(() => {
    let top = null;
    for (const s of sets) {
      const oneRM = estimate1RM(s.weight, s.reps);
      if (oneRM > 0 && (!top || oneRM > top.oneRM)) {
        top = { oneRM, weight: Number(s.weight) || 0, reps: Number(s.reps) || 0 };
      }
    }
    return top;
  }, [sets]);

  const update = (next) => {
    onChange({ ...exercise, ...next });
  };

  const commitName = () => {
    setEditingName(false);
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === exercise.name) return;
    update({ name: trimmed });
  };

  const addSet = () => {
    const last = sets[sets.length - 1];
    const next = last
      ? { reps: Number(last.reps) || 0, weight: Number(last.weight) || 0 }
      : { reps: 0, weight: 0 };
    update({ sets: [...sets, next] });
  };

  const updateSet = (idx, patch) => {
    const nextSets = sets.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    update({ sets: nextSets });
  };

  const removeSet = (idx) => {
    const nextSets = sets.filter((_, i) => i !== idx);
    update({ sets: nextSets });
  };

  return (
    <div className="exercise-card">
      <div className="exercise-card-head">
        {editingName ? (
          <input
            className="exercise-name-input"
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') {
                setNameDraft(exercise.name || '');
                setEditingName(false);
              }
            }}
          />
        ) : (
          <button
            className="exercise-name"
            onClick={() => {
              setNameDraft(exercise.name || '');
              setEditingName(true);
            }}
            title="Tap to rename"
          >
            {exercise.name || 'Unnamed exercise'}
          </button>
        )}
        <button
          className="icon-btn"
          onClick={onRemove}
          aria-label="Remove exercise"
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

      {best && (
        <div className="exercise-best">
          Best: {best.weight} × {best.reps} · 1RM {best.oneRM}
        </div>
      )}

      <div className="set-table">
        <div className="set-row set-head">
          <div>Set</div>
          <div>Reps</div>
          <div>Weight</div>
          <div>RPE</div>
          <div />
        </div>
        {sets.length === 0 ? (
          <div className="set-empty">No sets yet.</div>
        ) : (
          sets.map((s, i) => (
            <div className="set-row" key={i}>
              <div className="set-index">{i + 1}</div>
              <input
                className="set-input"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={s.reps === 0 || s.reps == null ? '' : s.reps}
                onChange={(e) =>
                  updateSet(i, { reps: e.target.value === '' ? 0 : Number(e.target.value) })
                }
              />
              <input
                className="set-input"
                type="number"
                inputMode="decimal"
                step="0.5"
                placeholder="0"
                value={s.weight === 0 || s.weight == null ? '' : s.weight}
                onChange={(e) =>
                  updateSet(i, {
                    weight: e.target.value === '' ? 0 : Number(e.target.value),
                  })
                }
              />
              <input
                className="set-input"
                type="number"
                inputMode="decimal"
                step="0.5"
                min="0"
                max="10"
                placeholder="—"
                value={s.rpe == null || s.rpe === '' ? '' : s.rpe}
                onChange={(e) =>
                  updateSet(i, {
                    rpe: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />
              <button
                className="icon-btn set-remove"
                onClick={() => removeSet(i)}
                aria-label={`Remove set ${i + 1}`}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <div className="exercise-card-foot">
        <button className="add-set-btn" onClick={addSet}>
          + Add set
        </button>
        {heaviest && (
          <div className="est-1rm">
            est 1RM {heaviest.oneRM} ({heaviest.weight} × {heaviest.reps})
          </div>
        )}
      </div>
    </div>
  );
}
