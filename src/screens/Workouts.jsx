import React, { useMemo, useState } from 'react';
import {
  getDay,
  addWorkout,
  updateWorkout,
  deleteWorkout,
} from '../lib/storage.js';
import { formatShortDate, parseKey } from '../lib/dates.js';
import ExerciseCard from '../components/ExerciseCard.jsx';
import PPLTemplatePicker from '../components/PPLTemplatePicker.jsx';

export default function Workouts({ date, profile, onChange }) {
  const day = useMemo(() => getDay(date), [date, profile]);
  const workouts = day.workouts || [];

  const [picking, setPicking] = useState(false);
  const [openId, setOpenId] = useState(workouts[0]?.id || null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handlePick = (tpl) => {
    const exercises = (tpl.exercises || []).map((n) =>
      typeof n === 'string' ? { name: n, sets: [] } : { name: n.name, sets: [] }
    );
    const next = addWorkout(date, {
      template: tpl.id,
      name: tpl.name,
      exercises,
    });
    setPicking(false);
    if (next && next.length) {
      setOpenId(next[next.length - 1].id);
    }
    onChange?.();
  };

  const patchWorkout = (id, patch) => {
    updateWorkout(date, id, patch);
    onChange?.();
  };

  const updateExerciseAt = (workout, idx, nextExercise) => {
    const exercises = workout.exercises.map((ex, i) =>
      i === idx ? nextExercise : ex
    );
    patchWorkout(workout.id, { exercises });
  };

  const removeExerciseAt = (workout, idx) => {
    const exercises = workout.exercises.filter((_, i) => i !== idx);
    patchWorkout(workout.id, { exercises });
  };

  const addExercise = (workout) => {
    const exercises = [
      ...(workout.exercises || []),
      { name: 'New exercise', sets: [] },
    ];
    patchWorkout(workout.id, { exercises });
  };

  const handleDelete = (id) => {
    deleteWorkout(date, id);
    setConfirmDelete(null);
    if (openId === id) setOpenId(null);
    onChange?.();
  };

  const renameWorkout = (workout, name) => {
    patchWorkout(workout.id, { name });
  };

  return (
    <div className="screen">
      <div className="today-header">
        <div className="h-label">Train</div>
        <div className="day">{formatShortDate(parseKey(date))}</div>
      </div>

      <div className="workouts-list">
        {workouts.length === 0 ? (
          <div className="empty">Nothing logged yet. Tap "+ Add session" to start.</div>
        ) : (
          workouts.map((w) => {
            const open = openId === w.id;
            const totalSets = (w.exercises || []).reduce(
              (n, ex) => n + (ex.sets?.length || 0),
              0
            );
            return (
              <div className={`workout-session ${open ? 'open' : ''}`} key={w.id}>
                <div className="workout-session-head">
                  <button
                    className="workout-session-toggle"
                    onClick={() => setOpenId(open ? null : w.id)}
                    aria-label={open ? 'Collapse' : 'Expand'}
                  >
                    {open ? '▾' : '▸'}
                  </button>
                  {open ? (
                    <input
                      className="workout-name-input"
                      value={w.name || ''}
                      onChange={(e) => renameWorkout(w, e.target.value)}
                      placeholder="Session name"
                    />
                  ) : (
                    <div className="workout-name">{w.name || 'Session'}</div>
                  )}
                  <div className="workout-meta">
                    {(w.exercises || []).length} ex · {totalSets} sets
                  </div>
                </div>

                {open && (
                  <div className="workout-session-body">
                    {(w.exercises || []).length === 0 ? (
                      <div className="empty">No exercises yet.</div>
                    ) : (
                      (w.exercises || []).map((ex, i) => (
                        <ExerciseCard
                          key={`${w.id}-${i}`}
                          exercise={ex}
                          profile={profile}
                          onChange={(next) => updateExerciseAt(w, i, next)}
                          onRemove={() => removeExerciseAt(w, i)}
                        />
                      ))
                    )}

                    <button
                      className="btn-ghost add-exercise-btn"
                      onClick={() => addExercise(w)}
                    >
                      + Add exercise
                    </button>

                    {confirmDelete === w.id ? (
                      <div className="confirm-inline">
                        <span>Delete this session?</span>
                        <div>
                          <button
                            className="btn-sm"
                            onClick={() => setConfirmDelete(null)}
                          >
                            Cancel
                          </button>
                          <button
                            className="danger-btn sm"
                            onClick={() => handleDelete(w.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="danger-btn sm"
                        onClick={() => setConfirmDelete(w.id)}
                      >
                        Delete session
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        <button
          className="btn-primary add-session-btn"
          onClick={() => setPicking(true)}
        >
          + Add session
        </button>
      </div>

      {picking && (
        <PPLTemplatePicker
          onPick={handlePick}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  );
}
