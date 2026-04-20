import React, { useRef, useState } from 'react';
import { parseFoodText, parseFoodPhoto } from '../lib/ai.js';
import { addFoodToMeal } from '../lib/storage.js';
import { MEAL_KEYS, mealLabelFor } from '../lib/constants.js';

export default function AIMealModal({ profile, date, defaultMeal = 'lunch', onClose, onLogged }) {
  const [mode, setMode] = useState('text');
  const [text, setText] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [meal, setMeal] = useState(defaultMeal);
  const [parsing, setParsing] = useState(false);
  const [items, setItems] = useState(null);
  const [err, setErr] = useState(null);
  const fileRef = useRef(null);

  const handlePhotoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1024;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        setPhotoDataUrl(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const runParse = async () => {
    setErr(null);
    setParsing(true);
    try {
      const parsed = mode === 'text'
        ? await parseFoodText(text)
        : await parseFoodPhoto(photoDataUrl);
      if (!parsed.length) {
        setErr('No foods detected.');
      } else {
        setItems(parsed.map((it) => ({ ...it, selected: true })));
      }
    } catch (e) {
      setErr(e?.message || 'AI parse failed.');
    } finally {
      setParsing(false);
    }
  };

  const toggleItem = (idx) => {
    setItems((list) => list.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it));
  };

  const logAll = () => {
    const keep = items.filter((it) => it.selected);
    for (const it of keep) {
      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fdcId: `ai:${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name: `${it.name} (${it.serving})`,
        grams: 0,
        calories: it.calories,
        protein: it.protein,
        fat: it.fat,
        carbs: it.carbs,
        fiber: it.fiber,
        sugar: it.sugar,
        sodium: it.sodium,
      };
      addFoodToMeal(date, meal, entry);
    }
    onLogged?.(meal, keep.length);
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet ai-meal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ai-meal-head">
          <h2>✨ AI meal entry</h2>
          <button className="sheet-close" onClick={onClose}>×</button>
        </div>

        {!items && (
          <>
            <div className="ai-mode-tabs">
              <button
                className={`ai-mode-tab${mode === 'text' ? ' active' : ''}`}
                onClick={() => setMode('text')}
                type="button"
              >
                Describe
              </button>
              <button
                className={`ai-mode-tab${mode === 'photo' ? ' active' : ''}`}
                onClick={() => setMode('photo')}
                type="button"
              >
                Photo
              </button>
            </div>

            {mode === 'text' && (
              <>
                <div className="h-label">What did you eat?</div>
                <textarea
                  className="ai-textarea"
                  rows={4}
                  placeholder="2 eggs, 1 slice wheat toast with butter, black coffee"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </>
            )}

            {mode === 'photo' && (
              <>
                <div className="h-label">Upload a meal photo</div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoPick}
                  style={{ display: 'none' }}
                />
                {photoDataUrl ? (
                  <div className="ai-photo-preview">
                    <img src={photoDataUrl} alt="meal" />
                    <button className="btn-ghost" onClick={() => { setPhotoDataUrl(null); fileRef.current.value = ''; }}>
                      Retake
                    </button>
                  </div>
                ) : (
                  <button className="ai-photo-pick" onClick={() => fileRef.current.click()} type="button">
                    📷 Take or choose photo
                  </button>
                )}
              </>
            )}

            <div className="h-label">Meal</div>
            <div className="meal-picker">
              {MEAL_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`meal-pill${meal === k ? ' active' : ''}`}
                  onClick={() => setMeal(k)}
                >
                  {mealLabelFor(profile, k)}
                </button>
              ))}
            </div>

            {err && <div className="error">{err}</div>}

            <div className="section-actions">
              <button
                className="btn-primary"
                onClick={runParse}
                disabled={parsing || (mode === 'text' ? !text.trim() : !photoDataUrl)}
              >
                {parsing ? <><span className="spinner" /> Analyzing…</> : 'Analyze'}
              </button>
              <button className="btn-ghost" onClick={onClose}>Cancel</button>
            </div>
          </>
        )}

        {items && (
          <>
            <div className="ai-results-head">
              <div>Detected {items.length} item{items.length === 1 ? '' : 's'} — uncheck to exclude</div>
            </div>
            <div className="ai-items">
              {items.map((it, i) => (
                <label key={i} className="ai-item">
                  <input type="checkbox" checked={it.selected} onChange={() => toggleItem(i)} />
                  <div className="ai-item-main">
                    <div className="ai-item-name">{it.name}</div>
                    <div className="ai-item-meta">
                      {it.serving} · {it.calories} kcal · {it.protein}P / {it.fat}F / {it.carbs}C
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="section-actions">
              <button className="btn-primary" onClick={logAll} disabled={!items.some((i) => i.selected)}>
                Log to {mealLabelFor(profile, meal)}
              </button>
              <button className="btn-ghost" onClick={() => setItems(null)}>Back</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
