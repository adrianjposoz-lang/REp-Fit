import React, { useEffect, useMemo, useState } from 'react';
import { searchFoods } from '../lib/usda.js';
import {
  addFood,
  addRecentFood,
  getRecentFoods,
} from '../lib/storage.js';
import { todayKey } from '../lib/dates.js';

export default function Food({ onChange, prefill, clearPrefill }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [recent, setRecent] = useState(() => getRecentFoods());

  useEffect(() => {
    if (prefill) {
      setSelected(prefill);
      clearPrefill?.();
    }
  }, [prefill, clearPrefill]);

  const runSearch = async (q) => {
    const text = (q ?? query).trim();
    if (!text) return;
    setLoading(true);
    setError(null);
    try {
      const foods = await searchFoods(text);
      setResults(foods);
    } catch (e) {
      setError(e.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (food) => {
    setSelected(food);
  };

  const handleLog = (food, grams) => {
    const g = Number(grams) || 0;
    const per = food.per100g || { calories: 0, protein: 0, fat: 0, carbs: 0 };
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fdcId: food.fdcId,
      name: food.name,
      grams: g,
      calories: +((per.calories / 100) * g).toFixed(1),
      protein: +((per.protein / 100) * g).toFixed(1),
      fat: +((per.fat / 100) * g).toFixed(1),
      carbs: +((per.carbs / 100) * g).toFixed(1),
    };
    addFood(todayKey(), entry);
    setRecent(addRecentFood({ fdcId: food.fdcId, name: food.name, per100g: per }));
    onChange();
    setSelected(null);
  };

  return (
    <div className="screen">
      <div className="today-header">
        <div className="h-label">Food Search</div>
        <div className="day" style={{ fontSize: 28 }}>Log a Food</div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search foods..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') runSearch();
          }}
        />
        <button
          className="btn-primary"
          onClick={() => runSearch()}
          disabled={!query.trim() || loading}
        >
          {loading ? '...' : 'Go'}
        </button>
      </div>

      {error && (
        <div className="error">
          <span>Search failed: {error}</span>
          <button className="btn-sm" onClick={() => runSearch()}>
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="loading">
          <span className="spinner" /> Searching USDA...
        </div>
      )}

      {!loading && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="h-section">Results</div>
          {results.map((r) => (
            <ResultRow key={r.fdcId} food={r} onAdd={handleAdd} />
          ))}
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <>
          {recent.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="h-section">Recent</div>
              {recent.map((r) => (
                <ResultRow key={r.fdcId} food={r} onAdd={handleAdd} />
              ))}
            </div>
          ) : (
            <div className="empty">
              Search USDA for any food to log its calories and protein. Try "chicken breast" or "rice cooked".
            </div>
          )}
        </>
      )}

      {selected && (
        <AddSheet
          food={selected}
          onClose={() => setSelected(null)}
          onConfirm={handleLog}
        />
      )}
    </div>
  );
}

function ResultRow({ food, onAdd }) {
  const per = food.per100g || { calories: 0, protein: 0, fat: 0, carbs: 0 };
  return (
    <div className="result-row">
      <div className="title">{food.name}{food.brand ? ` — ${food.brand}` : ''}</div>
      <div className="pills">
        <span className="pill kcal"><b>{Math.round(per.calories)}</b> kcal</span>
        <span className="pill prot"><b>{per.protein.toFixed(1)}g</b> protein</span>
        <span className="pill fat"><b>{per.fat.toFixed(1)}g</b> fat</span>
        <span className="pill carb"><b>{per.carbs.toFixed(1)}g</b> carb</span>
        <span className="pill">per 100g</span>
      </div>
      <div className="actions">
        <button className="btn-add" onClick={() => onAdd(food)}>Add</button>
      </div>
    </div>
  );
}

function AddSheet({ food, onClose, onConfirm }) {
  const [grams, setGrams] = useState('100');
  const per = food.per100g || { calories: 0, protein: 0, fat: 0, carbs: 0 };
  const g = Number(grams) || 0;

  const calc = useMemo(
    () => ({
      calories: (per.calories / 100) * g,
      protein: (per.protein / 100) * g,
      fat: (per.fat / 100) * g,
      carbs: (per.carbs / 100) * g,
    }),
    [g, per]
  );

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>{food.name}</h2>
        <div className="h-label">Serving size</div>
        <div className="grams-input">
          <input
            type="number"
            inputMode="decimal"
            value={grams}
            autoFocus
            onChange={(e) => setGrams(e.target.value)}
          />
          <span className="unit">grams</span>
        </div>

        <div className="calc-grid">
          <div className="calc-box">
            <div className="k">Cal</div>
            <div className="v" style={{ color: 'var(--accent-amber)' }}>{Math.round(calc.calories)}</div>
          </div>
          <div className="calc-box">
            <div className="k">Prot</div>
            <div className="v" style={{ color: 'var(--accent-green)' }}>{calc.protein.toFixed(1)}</div>
          </div>
          <div className="calc-box">
            <div className="k">Fat</div>
            <div className="v" style={{ color: 'var(--accent-cyan)' }}>{calc.fat.toFixed(1)}</div>
          </div>
          <div className="calc-box">
            <div className="k">Carb</div>
            <div className="v">{calc.carbs.toFixed(1)}</div>
          </div>
        </div>

        <div className="row-btns">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={() => onConfirm(food, grams)}
            disabled={!g}
          >
            Log Food
          </button>
        </div>
      </div>
    </div>
  );
}
