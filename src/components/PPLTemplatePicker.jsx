import React from 'react';
import { PPL_TEMPLATES } from '../lib/constants.js';

const ICONS = {
  push: '↑',
  pull: '↓',
  legs: '⎍',
  upper: '◐',
  lower: '◑',
  custom: '+',
};

const TINTS = {
  push: 'amber',
  pull: 'green',
  legs: 'blue',
  upper: 'cyan',
  lower: 'cyan',
  custom: 'white',
};

export default function PPLTemplatePicker({ onPick, onClose }) {
  const handlePick = (tpl) => {
    // Deep clone so the caller can mutate freely.
    const cloned = {
      ...tpl,
      exercises: tpl.exercises.map((n) =>
        typeof n === 'string' ? n : { ...n }
      ),
    };
    onPick(cloned);
  };

  return (
    <div className="ppl-backdrop" onClick={onClose}>
      <div className="ppl-picker" onClick={(e) => e.stopPropagation()}>
        <div className="ppl-picker-head">
          <div className="h-label">Choose a template</div>
          {onClose && (
            <button className="btn-sm" onClick={onClose}>
              Cancel
            </button>
          )}
        </div>
        <div className="ppl-grid">
          {PPL_TEMPLATES.map((t) => (
            <button
              key={t.id}
              className={`ppl-card tint-${TINTS[t.id] || 'white'}`}
              onClick={() => handlePick(t)}
            >
              <div className="ppl-icon">{ICONS[t.id] || '•'}</div>
              <div className="ppl-name">{t.name}</div>
              <div className="ppl-count">
                {t.exercises.length === 0
                  ? 'Build your own'
                  : `${t.exercises.length} exercises`}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
