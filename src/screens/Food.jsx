import React, { useEffect, useRef, useState } from 'react';
import { searchFoods } from '../lib/usda.js';
import {
  addFoodToMeal,
  addRecent,
  getCustomFoods,
  getFavorites,
  getRecent,
  getRecipes,
  isFavorite,
  toggleFavorite,
} from '../lib/storage.js';
import { todayKey } from '../lib/dates.js';
import { MEAL_KEYS, MEAL_LABELS, mealLabelFor } from '../lib/constants.js';
import VoiceSearch from '../components/VoiceSearch.jsx';
import QuickAddSheet from '../components/QuickAddSheet.jsx';
import CustomFoods from './CustomFoods.jsx';
import Recipes from './Recipes.jsx';

const TABS = [
  { id: 'usda', label: 'USDA' },
  { id: 'custom', label: 'Custom' },
  { id: 'recipes', label: 'Recipes' },
  { id: 'manage', label: 'Manage' },
];

export default function Food({
  profile,
  date,
  onChange,
  onGo,
  prefill,
  clearPrefill,
}) {
  const activeDate = date || todayKey();
  const [tab, setTab] = useState('usda');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState('lunch');
  const [toast, setToast] = useState(null);
  const [favoritesState, setFavoritesState] = useState(() => getFavorites());
  const [recentState, setRecentState] = useState(() => getRecent());
  const [customState, setCustomState] = useState(() => getCustomFoods());
  const [recipesState, setRecipesState] = useState(() => getRecipes());
  const [recipeToLog, setRecipeToLog] = useState(null);
  const [manageView, setManageView] = useState(null); // 'customFoods' | 'recipes'

  const abortRef = useRef(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    setFavoritesState(getFavorites());
    setRecentState(getRecent());
    setCustomState(getCustomFoods());
    setRecipesState(getRecipes());
  }, [profile]);

  useEffect(() => {
    if (prefill) {
      setSelected(prefill.food || null);
      setSelectedMeal(prefill.mealKey || 'lunch');
      clearPrefill?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  useEffect(() => {
    if (tab !== 'usda') {
      if (abortRef.current) abortRef.current.abort();
      return;
    }
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
  }, [query, tab]);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  };

  const openSheet = (food) => setSelected(food);

  const handleToggleFav = (food) => {
    toggleFavorite({ fdcId: food.fdcId, name: food.name, per100g: food.per100g });
    setFavoritesState(getFavorites());
  };

  const handleLogged = (entry, mealKey) => {
    setSelected(null);
    setRecentState(getRecent());
    onChange?.();
    showToast(`Added to ${mealLabelFor(profile, mealKey)}`);
  };

  const handleRecipeLogged = (recipe, mealKey) => {
    setRecipeToLog(null);
    onChange?.();
    showToast(`Added to ${mealLabelFor(profile, mealKey)}`);
  };

  const refreshLocalLists = () => {
    setCustomState(getCustomFoods());
    setRecipesState(getRecipes());
  };

  // Manage screens open inline
  if (manageView === 'customFoods') {
    return (
      <CustomFoods
        onClose={() => {
          refreshLocalLists();
          setManageView(null);
        }}
      />
    );
  }
  if (manageView === 'recipes') {
    return (
      <Recipes
        onClose={() => {
          refreshLocalLists();
          setManageView(null);
        }}
        date={activeDate}
        onChange={onChange}
        profile={profile}
      />
    );
  }

  const showingResults = tab === 'usda' && query.trim().length > 0;
  const suggestions = results.slice(0, 8);

  return (
    <div className="screen">
      <div className="today-header">
        <div className="h-label">Food Search</div>
        <div className="day" style={{ fontSize: 28 }}>Log a Food</div>
      </div>

      <div className="food-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`food-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== 'manage' && (
        <div className="meal-picker">
          {MEAL_KEYS.map((k) => (
            <button
              key={k}
              className={`meal-pill${selectedMeal === k ? ' active' : ''}`}
              onClick={() => setSelectedMeal(k)}
            >
              {mealLabelFor(profile, k)}
            </button>
          ))}
        </div>
      )}

      {tab === 'usda' && (
        <>
          <div className="search-bar" style={{ alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search foods..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <VoiceSearch
              onTranscript={(text) => {
                if (!text) return;
                setQuery(text);
              }}
              onError={(msg) => showToast(msg)}
            />
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
            <div className="autocomplete-list" style={{ position: 'static' }}>
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
                <div className="empty">
                  Tap the star on any food to save a favorite.
                </div>
              ) : (
                <div className="autocomplete-list" style={{ position: 'static' }}>
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
                <div className="autocomplete-list" style={{ position: 'static' }}>
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
        </>
      )}

      {tab === 'custom' && (
        <>
          {customState.length === 0 ? (
            <div className="empty">
              You haven't added any custom foods yet. Open the Manage tab to
              create one.
            </div>
          ) : (
            <div className="autocomplete-list" style={{ position: 'static' }}>
              {customState.map((f) => (
                <CustomFoodRow
                  key={f.id}
                  food={f}
                  onPick={() => openSheet(f)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'recipes' && (
        <>
          {recipesState.length === 0 ? (
            <div className="empty">
              You haven't saved any recipes yet. Open the Manage tab to build
              one.
            </div>
          ) : (
            <div className="autocomplete-list" style={{ position: 'static' }}>
              {recipesState.map((r) => (
                <RecipePickRow
                  key={r.id}
                  recipe={r}
                  onPick={() => setRecipeToLog(r)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'manage' && (
        <div className="settings-section" style={{ gap: 10 }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ height: 56, justifyContent: 'space-between', padding: '0 16px' }}
            onClick={() => setManageView('customFoods')}
          >
            <span>Manage custom foods</span>
            <span className="muted">›</span>
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ height: 56, justifyContent: 'space-between', padding: '0 16px' }}
            onClick={() => setManageView('recipes')}
          >
            <span>Manage recipes</span>
            <span className="muted">›</span>
          </button>
          <div className="hint" style={{ marginTop: 6 }}>
            Custom foods and recipes stay on this device with your profile.
          </div>
        </div>
      )}

      {selected && (
        <QuickAddSheet
          food={selected}
          mealKey={selectedMeal}
          date={activeDate}
          onClose={() => setSelected(null)}
          onLogged={handleLogged}
          profile={profile}
        />
      )}

      {recipeToLog && (
        <LogRecipeInline
          recipe={recipeToLog}
          mealKey={selectedMeal}
          date={activeDate}
          onClose={() => setRecipeToLog(null)}
          onLogged={(mealKey) => handleRecipeLogged(recipeToLog, mealKey)}
          profile={profile}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function AutocompleteRow({ food, fav, onPick, onToggleFav }) {
  const per = food.per100g || { calories: 0, protein: 0, fat: 0, carbs: 0 };
  return (
    <div className="autocomplete-row">
      <button
        className={`fav-star${fav ? ' active' : ''}`}
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
            fontWeight: 600,
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

function CustomFoodRow({ food, onPick }) {
  const per = food.per100g || { calories: 0, protein: 0, fat: 0, carbs: 0 };
  return (
    <div className="autocomplete-row" onClick={onPick} style={{ cursor: 'pointer' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="name"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 600,
          }}
        >
          {food.name}
        </div>
        <div className="pills">
          <span className="pill kcal"><b>{Math.round(per.calories)}</b> kcal</span>
          <span className="pill prot"><b>{Number(per.protein || 0).toFixed(1)}g</b> P</span>
          <span className="pill fat"><b>{Number(per.fat || 0).toFixed(1)}g</b> F</span>
          <span className="pill carb"><b>{Number(per.carbs || 0).toFixed(1)}g</b> C</span>
          <span className="pill">/100g</span>
          {food.gramsPerUnit ? (
            <span className="pill">1pc={food.gramsPerUnit}g</span>
          ) : null}
        </div>
      </div>
      <button className="btn-add" type="button" onClick={onPick}>Add</button>
    </div>
  );
}

function RecipePickRow({ recipe, onPick }) {
  const svg = Math.max(1, Number(recipe.servings) || 1);
  const per = {
    calories: (recipe.totals?.calories || 0) / svg,
    protein: (recipe.totals?.protein || 0) / svg,
    fat: (recipe.totals?.fat || 0) / svg,
    carbs: (recipe.totals?.carbs || 0) / svg,
  };
  return (
    <div className="autocomplete-row" onClick={onPick} style={{ cursor: 'pointer' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="name"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 600,
          }}
        >
          {recipe.name}
        </div>
        <div className="pills">
          <span className="pill kcal"><b>{Math.round(per.calories)}</b> kcal</span>
          <span className="pill prot"><b>{per.protein.toFixed(1)}g</b> P</span>
          <span className="pill fat"><b>{per.fat.toFixed(1)}g</b> F</span>
          <span className="pill carb"><b>{per.carbs.toFixed(1)}g</b> C</span>
          <span className="pill">/serving · {recipe.servings}x</span>
        </div>
      </div>
      <button className="btn-add" type="button" onClick={onPick}>Log</button>
    </div>
  );
}

function LogRecipeInline({ recipe, mealKey, date, onClose, onLogged, profile }) {
  const [meal, setMeal] = useState(mealKey || 'lunch');
  const svg = Math.max(1, Number(recipe.servings) || 1);
  const per = {
    calories: round1((recipe.totals?.calories || 0) / svg),
    protein: round1((recipe.totals?.protein || 0) / svg),
    fat: round1((recipe.totals?.fat || 0) / svg),
    carbs: round1((recipe.totals?.carbs || 0) / svg),
  };

  const log = () => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      recipeId: recipe.id,
      name: `${recipe.name} (1 serving)`,
      grams: 0,
      ...per,
    };
    addFoodToMeal(date, meal, entry);
    addRecent({
      fdcId: `recipe:${recipe.id}`,
      name: `${recipe.name} (1 serving)`,
      per100g: per,
    });
    onLogged?.(meal);
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>{recipe.name}</h2>

        <div className="h-label">Meal</div>
        <div className="meal-picker">
          {MEAL_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              className={`meal-pill${meal === k ? ' active' : ''}`}
              onClick={() => setMeal(k)}
            >
              {profile ? mealLabelFor(profile, k) : MEAL_LABELS[k]}
            </button>
          ))}
        </div>

        <div className="calc-grid">
          <div className="calc-box">
            <div className="k">Cal</div>
            <div className="v" style={{ color: 'var(--accent-amber)' }}>
              {Math.round(per.calories)}
            </div>
          </div>
          <div className="calc-box">
            <div className="k">Prot</div>
            <div className="v" style={{ color: 'var(--accent-green)' }}>
              {per.protein.toFixed(1)}
            </div>
          </div>
          <div className="calc-box">
            <div className="k">Fat</div>
            <div className="v" style={{ color: 'var(--accent-cyan)' }}>
              {per.fat.toFixed(1)}
            </div>
          </div>
          <div className="calc-box">
            <div className="k">Carb</div>
            <div className="v">{per.carbs.toFixed(1)}</div>
          </div>
        </div>

        <div className="hint">Logs 1 serving ({svg} per recipe).</div>

        <div className="row-btns">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={log}>
            Log 1 serving
          </button>
        </div>
      </div>
    </div>
  );
}

function round1(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}
