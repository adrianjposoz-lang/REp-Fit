import React, { useEffect, useRef, useState } from 'react';
import { searchFoods } from '../lib/usda.js';
import { searchOFF } from '../lib/openfoodfacts.js';
import { isOFFEnabled } from '../lib/foodSearchConfig.js';
import {
  addFoodToMeal,
  addRecent,
  getCustomFoods,
  getFavorites,
  getRecent,
  getRecipes,
  getUsualMeals,
  deleteUsualMeal,
  logUsualMeal,
  isFavorite,
  toggleFavorite,
} from '../lib/storage.js';
import { todayKey } from '../lib/dates.js';
import { MEAL_KEYS, MEAL_LABELS, mealLabelFor } from '../lib/constants.js';
import VoiceSearch from '../components/VoiceSearch.jsx';
import QuickAddSheet from '../components/QuickAddSheet.jsx';
import BarcodeScanner from '../components/BarcodeScanner.jsx';
import { lookupBarcode } from '../lib/openfoodfacts.js';
import CustomFoods from './CustomFoods.jsx';
import Recipes from './Recipes.jsx';

function normalizeForDedupe(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function mergeFoodResults(usda, off) {
  const seen = new Set();
  const out = [];
  for (const item of [...usda, ...off]) {
    const key = `${normalizeForDedupe(item.brand)}|${normalizeForDedupe(item.name)}`;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

const TABS = [
  { id: 'usda', label: 'USDA' },
  { id: 'custom', label: 'Custom' },
  { id: 'usuals', label: 'My usuals' },
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
  const [usualsState, setUsualsState] = useState(() => getUsualMeals());
  const [scannerOpen, setScannerOpen] = useState(false);
  const [barcodeLoading, setBarcodeLoading] = useState(false);

  const abortRef = useRef(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    setFavoritesState(getFavorites());
    setRecentState(getRecent());
    setCustomState(getCustomFoods());
    setRecipesState(getRecipes());
    setUsualsState(getUsualMeals());
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
      const offOn = isOFFEnabled();
      const [usda, off] = await Promise.allSettled([
        searchFoods(text, { signal: ctl.signal, pageSize: 12 }),
        offOn
          ? searchOFF(text, { signal: ctl.signal, pageSize: 15 })
          : Promise.resolve([]),
      ]);
      if (ctl.signal.aborted) return;
      const usdaItems = usda.status === 'fulfilled' ? usda.value : [];
      const offItems = off.status === 'fulfilled' ? off.value : [];
      const merged = mergeFoodResults(usdaItems, offItems);
      setResults(merged);
      if (merged.length === 0) {
        if (usda.status === 'rejected' && off.status === 'rejected') {
          setError(usda.reason?.message || 'Search failed');
        } else if (usda.status === 'rejected' && !offOn) {
          setError(usda.reason?.message || 'Search failed');
        } else {
          setError(null);
        }
      } else {
        setError(null);
      }
      setLoading(false);
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
    setUsualsState(getUsualMeals());
  };

  const handleBarcodeScanned = async (code) => {
    setScannerOpen(false);
    if (!code) return;
    setBarcodeLoading(true);
    try {
      const food = await lookupBarcode(code);
      setSelected(food);
    } catch (e) {
      showToast('Barcode not found — try USDA search');
    } finally {
      setBarcodeLoading(false);
    }
  };

  const handleLogUsual = (usual) => {
    logUsualMeal(activeDate, usual.id, selectedMeal);
    onChange?.();
    setRecentState(getRecent());
    showToast(`Added to ${mealLabelFor(profile, selectedMeal)}`);
  };

  const handleDeleteUsual = (usual) => {
    const next = deleteUsualMeal(usual.id);
    setUsualsState(next || getUsualMeals());
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
            <div className="food-search-icons">
              <VoiceSearch
                onTranscript={(text) => {
                  if (!text) return;
                  setQuery(text);
                }}
                onError={(msg) => showToast(msg)}
              />
              <button
                type="button"
                className="food-icon-btn"
                onClick={() => setScannerOpen(true)}
                aria-label="Scan barcode"
                title="Scan barcode"
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
                  <path d="M3 5v14M7 5v14M10 5v14M14 5v14M17 5v14M21 5v14" />
                </svg>
              </button>
            </div>
          </div>

          {barcodeLoading && (
            <div className="loading">
              <span className="spinner" /> Looking up barcode...
            </div>
          )}

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

      {tab === 'usuals' && (
        <>
          {usualsState.length === 0 ? (
            <div className="empty">
              Save a meal as "my usual" from the Today screen to re-log it
              here with one tap.
            </div>
          ) : (
            <div className="autocomplete-list" style={{ position: 'static' }}>
              {usualsState.map((u) => (
                <UsualRow
                  key={u.id}
                  usual={u}
                  onLog={() => handleLogUsual(u)}
                  onDelete={() => handleDeleteUsual(u)}
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

      {scannerOpen && (
        <BarcodeScanner
          onScan={(code) => handleBarcodeScanned(code)}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function UsualRow({ usual, onLog, onDelete }) {
  const items = usual.items || [];
  const totalKcal = items.reduce((s, it) => s + (Number(it.calories) || 0), 0);
  return (
    <div className="usual-row">
      <div className="usual-row-main">
        <div className="usual-row-name">{usual.name}</div>
        <div className="usual-row-caption">
          {items.length} item{items.length === 1 ? '' : 's'} ·{' '}
          {Math.round(totalKcal)} kcal
        </div>
      </div>
      <div className="usual-row-actions">
        <button
          type="button"
          className="btn-add"
          onClick={onLog}
          aria-label="Log this usual meal"
        >
          Log
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onDelete}
          aria-label="Delete usual"
          title="Delete"
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
