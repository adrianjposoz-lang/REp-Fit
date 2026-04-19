import React, { useEffect, useMemo, useRef, useState } from 'react';
import { searchFoods } from '../lib/usda.js';
import {
  addFoodToMeal,
  addRecent,
  getFavorites,
  getRecent,
  isFavorite,
  toggleFavorite,
} from '../lib/storage.js';
import { todayKey } from '../lib/dates.js';
import { MEAL_KEYS, MEAL_LABELS } from '../lib/constants.js';
import QuickAddSheet from '../components/QuickAddSheet.jsx';

export default function Food({
  profile,
  date,
  onChange,
  onGo,
  prefill,
  clearPrefill,
}) {
  const activeDate = date || todayKey();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState('lunch');
  const [quickOpen, setQuickOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [favoritesState, setFavoritesState] = useState(() => getFavorites());
  const [recentState, setRecentState] = useState(() => getRecent());

  const abortRef = useRef(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    setFavoritesState(getFavorites());
    setRecentState(getRecent());
  }, [profile]);

  useEffect(() => {
    if (prefill) {
      setSelected(prefill.food || null);
      setSelectedMeal(prefill.mealKey || 'lunch');
      if (prefill.food) {
        // food came pre-attached (not typical); open sheet directly
      }
      clearPrefill?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  useEffect(() => {
    const text = query.trim();
    if (!text) {
      setResults([]);
      setError(null);
      setLoading(false);
      if (abortRef.current) abortRef.current.abort();
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;
    const handle = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const foods = await searchFoods(text, { signal: ctl.signal, pageSize: 12 });
        if (!ctl.signal.aborted) setResults(foods);
      } catch (e) {
        if (!ctl.signal.aborted) setError(e.message || 'Search failed');
      } finally {
        if (!ctl.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(handle);
      ctl.abort();
    };
  }, [query]);

  const openSheet = (food) => {
    setSelected(food);
  };

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  };

  const handleLog = (food, grams, mealKey) => {
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
    addFoodToMeal(activeDate, mealKey, entry);
    addRecent({ fdcId: food.fdcId, name: food.name, per100g: per });
    setRecentState(getRecent());
    onChange?.();
    setSelected(null);
    setQuery('');
    setResults([]);
    showToast(`Added to ${MEAL_LABELS[mealKey]}`);
  };

  const handleQuickAdd = (entry) => {
    const food = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: entry.name,
      grams: entry.grams || 0,
      calories: entry.calories,
      protein: entry.protein,
      fat: entry.fat,
      carbs: entry.carbs,
    };
    addFoodToMeal(activeDate, selectedMeal, food);
    onChange?.();
    showToast(`Added to ${MEAL_LABELS[selectedMeal]}`);
  };

  const handleToggleFav = (food) => {
    toggleFavorite({ fdcId: food.fdcId, name: food.name, per100g: food.per100g });
    setFavoritesState(getFavorites());
  };

  const showingResults = query.trim().length > 0;
  const suggestions = results.slice(0, 8);

  return (
    <div className="screen">
      <div className="today-header">
        <div className="h-label">Food Search</div>
        <div className="day" style={{ fontSize: 28 }}>Log a Food</div>
      </div>

      <div className="meal-picker">
        {MEAL_KEYS.map((k) => (
          <button
            key={k}
            className={`meal-pill${selectedMeal === k ? ' active' : ''}`}
            onClick={() => setSelectedMeal(k)}
          >
            {MEAL_LABELS[k]}
          </button>
        ))}
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search foods..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="btn-ghost"
          onClick={() => setQuickOpen(true)}
        >
          Quick Add
        </button>
      </div>

      {error && (
        <div className="error">
          <span>Search failed: {error}</span>
        </div>
      )}

      {showingResults && loading && (
        <div className="loading">
          <span className="spinner" /> Searching USDA...
        </div>
      )}

      {showingResults && !loading && suggestions.length > 0 && (
        <div className="autocomplete-list">
          {suggestions.map((r) => (
            <AutocompleteRow
              key={r.fdcId}
              food={r}
              fav={isFavorite(r.fdcId)}
              onPick={() => openSheet(r)}
              onToggleFav={() => handleToggleFav(r)}
            />
          ))}
        </div>
      )}

      {showingResults && !loading && !error && suggestions.length === 0 && (
        <div className="empty">No matches yet — keep typing.</div>
      )}

      {!showingResults && (
        <>
          <div className="h-section">⭐ Favorites</div>
          {favoritesState.length === 0 ? (
            <div className="empty">Tap the star on any food to save a favorite.</div>
          ) : (
            <div className="autocomplete-list">
              {favoritesState.map((r) => (
                <AutocompleteRow
                  key={r.fdcId}
                  food={r}
                  fav
                  onPick={() => openSheet(r)}
                  onToggleFav={() => handleToggleFav(r)}
                />
              ))}
            </div>
          )}

          <div className="h-section">Recent</div>
          {recentState.length === 0 ? (
            <div className="empty">
              Search USDA for any food to log its calories and protein.
            </div>
          ) : (
            <div className="autocomplete-list">
              {recentState.map((r) => (
                <AutocompleteRow
                  key={r.fdcId}
                  food={r}
                  fav={isFavorite(r.fdcId)}
                  onPick={() => openSheet(r)}
                  onToggleFav={() => handleToggleFav(r)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {selected && (
        <AddSheet
          food={selected}
          mealKey={selectedMeal}
          onMealChange={setSelectedMeal}
          onClose={() => setSelected(null)}
          onConfirm={handleLog}
        />
      )}

      <QuickAddSheet
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        onConfirm={handleQuickAdd}
      />

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 96,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--accent-green)',
            color: '#000',
            padding: '8px 14px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            zIndex: 50,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function AutocompleteRow({ food, fav, onPick, onToggleFav }) {
  const per = food.per100g || { calories: 0, protein: 0, fat: 0, carbs: 0 };
  return (
    <div className="autocomplete-row">
      <button
        className="fav-star"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFav();
        }}
        aria-label={fav ? 'Unfavorite' : 'Favorite'}
      >
        {fav ? '★' : '☆'}
      </button>
      <div
        style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
        onClick={onPick}
      >
        <div
          className="name"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {food.name}
          {food.brand ? ` — ${food.brand}` : ''}
        </div>
        <div className="pills">
          <span className="pill kcal"><b>{Math.round(per.calories)}</b> kcal</span>
          <span className="pill prot"><b>{Number(per.protein || 0).toFixed(1)}g</b> P</span>
          <span className="pill fat"><b>{Number(per.fat || 0).toFixed(1)}g</b> F</span>
          <span className="pill carb"><b>{Number(per.carbs || 0).toFixed(1)}g</b> C</span>
          <span className="pill">/100g</span>
        </div>
      </div>
      <button className="btn-add" onClick={onPick}>Add</button>
    </div>
  );
}

function AddSheet({ food, mealKey, onMealChange, onClose, onConfirm }) {
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

        <div className="h-label">Meal</div>
        <div className="meal-picker">
          {MEAL_KEYS.map((k) => (
            <button
              key={k}
              className={`meal-pill${mealKey === k ? ' active' : ''}`}
              onClick={() => onMealChange(k)}
            >
              {MEAL_LABELS[k]}
            </button>
          ))}
        </div>

        <div className="h-label" style={{ marginTop: 12 }}>Serving size</div>
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
            onClick={() => onConfirm(food, grams, mealKey)}
            disabled={!g}
          >
            Log Food
          </button>
        </div>
      </div>
    </div>
  );
}
