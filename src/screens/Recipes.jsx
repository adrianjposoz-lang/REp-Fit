import React, { useMemo, useState } from 'react';
import {
  getRecipes,
  addRecipe,
  deleteRecipe,
  addFoodToMeal,
  addRecent,
} from '../lib/storage.js';
import { MEAL_KEYS, MEAL_LABELS } from '../lib/constants.js';

const EMPTY_INGREDIENT = {
  name: '',
  grams: '',
  calories: '',
  protein: '',
  fat: '',
  carbs: '',
};

export default function Recipes({ onClose, date, onChange }) {
  const [recipes, setRecipes] = useState(() => getRecipes());
  const [name, setName] = useState('');
  const [servings, setServings] = useState('1');
  const [ingredients, setIngredients] = useState([]);
  const [draft, setDraft] = useState(EMPTY_INGREDIENT);
  const [logging, setLogging] = useState(null); // recipe object
  const [confirmId, setConfirmId] = useState(null);
  const [toast, setToast] = useState(null);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1400);
  };

  const setD = (k) => (e) => {
    const v = e?.target ? e.target.value : e;
    setDraft((d) => ({ ...d, [k]: v }));
  };

  const canAddIngredient =
    draft.name.trim().length > 0 &&
    Number(draft.grams) > 0 &&
    draft.calories !== '';

  const addIngredient = () => {
    if (!canAddIngredient) return;
    const ing = {
      name: draft.name.trim(),
      grams: Number(draft.grams) || 0,
      per100g: {
        calories: Number(draft.calories) || 0,
        protein: Number(draft.protein) || 0,
        fat: Number(draft.fat) || 0,
        carbs: Number(draft.carbs) || 0,
      },
    };
    setIngredients((a) => [...a, ing]);
    setDraft(EMPTY_INGREDIENT);
  };

  const removeIngredient = (idx) => {
    setIngredients((a) => a.filter((_, i) => i !== idx));
  };

  const totals = useMemo(() => {
    let c = 0, p = 0, f = 0, cb = 0;
    for (const ing of ingredients) {
      const factor = (Number(ing.grams) || 0) / 100;
      c += (ing.per100g.calories || 0) * factor;
      p += (ing.per100g.protein || 0) * factor;
      f += (ing.per100g.fat || 0) * factor;
      cb += (ing.per100g.carbs || 0) * factor;
    }
    return {
      calories: round1(c),
      protein: round1(p),
      fat: round1(f),
      carbs: round1(cb),
    };
  }, [ingredients]);

  const svg = Math.max(1, Number(servings) || 1);
  const perServing = useMemo(
    () => ({
      calories: round1(totals.calories / svg),
      protein: round1(totals.protein / svg),
      fat: round1(totals.fat / svg),
      carbs: round1(totals.carbs / svg),
    }),
    [totals, svg]
  );

  const canSaveRecipe =
    name.trim().length > 0 && ingredients.length > 0 && svg > 0;

  const saveRecipe = () => {
    if (!canSaveRecipe) return;
    const entry = {
      name: name.trim(),
      servings: svg,
      ingredients,
      totals,
    };
    const updated = addRecipe(entry);
    setRecipes(updated);
    setName('');
    setServings('1');
    setIngredients([]);
    setDraft(EMPTY_INGREDIENT);
    flash('Recipe saved');
  };

  const remove = (id) => {
    setRecipes(deleteRecipe(id));
    setConfirmId(null);
    flash('Deleted');
  };

  return (
    <div className="app-shell settings-shell">
      <header className="settings-header">
        <button
          type="button"
          className="ph-icon-btn"
          onClick={onClose}
          aria-label="Back"
          title="Back"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <div className="settings-title">Recipes</div>
        <div style={{ width: 36 }} />
      </header>

      <div className="screen settings-screen">
        <div className="settings-section">
          <div className="settings-section-title">New recipe</div>
          <div className="settings-card">
            <div className="food-form">
              <label className="food-form-row">
                <span>Name</span>
                <input
                  className="auth-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chicken stir-fry"
                />
              </label>
              <label className="food-form-row">
                <span>Servings</span>
                <input
                  className="auth-input"
                  type="number"
                  inputMode="decimal"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                />
              </label>

              <div className="h-label" style={{ marginTop: 6 }}>Ingredients</div>

              {ingredients.length > 0 && (
                <div className="ingredient-list">
                  {ingredients.map((ing, i) => {
                    const factor = (Number(ing.grams) || 0) / 100;
                    const kcal = Math.round((ing.per100g.calories || 0) * factor);
                    return (
                      <div key={i} className="ingredient-row">
                        <div className="ing-name">{ing.name}</div>
                        <div className="ing-g">{ing.grams}g</div>
                        <div className="ing-kcal">{kcal} kcal</div>
                        <button
                          className="icon-btn"
                          type="button"
                          onClick={() => removeIngredient(i)}
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="ingredient-builder">
                <input
                  className="auth-input"
                  placeholder="Ingredient name"
                  value={draft.name}
                  onChange={setD('name')}
                />
                <div className="food-form-grid">
                  <label className="food-form-row">
                    <span>Grams</span>
                    <input
                      className="auth-input"
                      type="number"
                      inputMode="decimal"
                      value={draft.grams}
                      onChange={setD('grams')}
                    />
                  </label>
                  <label className="food-form-row">
                    <span>Cal / 100g</span>
                    <input
                      className="auth-input"
                      type="number"
                      inputMode="decimal"
                      value={draft.calories}
                      onChange={setD('calories')}
                    />
                  </label>
                  <label className="food-form-row">
                    <span>Prot / 100g</span>
                    <input
                      className="auth-input"
                      type="number"
                      inputMode="decimal"
                      value={draft.protein}
                      onChange={setD('protein')}
                    />
                  </label>
                  <label className="food-form-row">
                    <span>Fat / 100g</span>
                    <input
                      className="auth-input"
                      type="number"
                      inputMode="decimal"
                      value={draft.fat}
                      onChange={setD('fat')}
                    />
                  </label>
                  <label className="food-form-row">
                    <span>Carb / 100g</span>
                    <input
                      className="auth-input"
                      type="number"
                      inputMode="decimal"
                      value={draft.carbs}
                      onChange={setD('carbs')}
                    />
                  </label>
                </div>
                <button
                  className="btn-ghost"
                  type="button"
                  onClick={addIngredient}
                  disabled={!canAddIngredient}
                  style={{ marginTop: 6 }}
                >
                  Add ingredient
                </button>
              </div>

              <div className="recipe-totals">
                <div className="rt-row">
                  <span className="rt-k">Total</span>
                  <span className="rt-v">
                    {Math.round(totals.calories)} kcal ·{' '}
                    {totals.protein.toFixed(1)}P · {totals.fat.toFixed(1)}F ·{' '}
                    {totals.carbs.toFixed(1)}C
                  </span>
                </div>
                <div className="rt-row muted">
                  <span className="rt-k">Per serving</span>
                  <span className="rt-v">
                    {Math.round(perServing.calories)} kcal ·{' '}
                    {perServing.protein.toFixed(1)}P ·{' '}
                    {perServing.fat.toFixed(1)}F ·{' '}
                    {perServing.carbs.toFixed(1)}C
                  </span>
                </div>
              </div>

              <div className="row-btns" style={{ marginTop: 4 }}>
                <span />
                <button
                  className="btn-primary"
                  type="button"
                  onClick={saveRecipe}
                  disabled={!canSaveRecipe}
                >
                  Save recipe
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Your recipes</div>
          {recipes.length === 0 ? (
            <div className="empty">
              No recipes yet. Build a recipe once and log one serving with a tap.
            </div>
          ) : (
            <div className="settings-card" style={{ padding: 0 }}>
              {recipes.map((r) => {
                const per = {
                  calories: round1((r.totals?.calories || 0) / (r.servings || 1)),
                  protein: round1((r.totals?.protein || 0) / (r.servings || 1)),
                  fat: round1((r.totals?.fat || 0) / (r.servings || 1)),
                  carbs: round1((r.totals?.carbs || 0) / (r.servings || 1)),
                };
                return (
                  <div key={r.id} className="recipe-row">
                    <button
                      className="recipe-row-main"
                      type="button"
                      onClick={() => setLogging(r)}
                    >
                      <div className="cf-name">{r.name}</div>
                      <div className="cf-meta">
                        {r.servings} servings ·{' '}
                        {Math.round(per.calories)} kcal ·{' '}
                        {per.protein.toFixed(1)}P / serving
                      </div>
                    </button>
                    <div className="cf-actions">
                      {confirmId === r.id ? (
                        <>
                          <button
                            className="danger-btn sm"
                            type="button"
                            onClick={() => remove(r.id)}
                          >
                            Confirm
                          </button>
                          <button
                            className="btn-sm"
                            type="button"
                            onClick={() => setConfirmId(null)}
                          >
                            No
                          </button>
                        </>
                      ) : (
                        <button
                          className="danger-btn sm"
                          type="button"
                          onClick={() => setConfirmId(r.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {logging && (
        <LogRecipeSheet
          recipe={logging}
          date={date}
          onClose={() => setLogging(null)}
          onLogged={(mealKey) => {
            setLogging(null);
            onChange?.();
            flash(`Added to ${MEAL_LABELS[mealKey]}`);
          }}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function LogRecipeSheet({ recipe, date, onClose, onLogged }) {
  const [meal, setMeal] = useState('lunch');
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
      per100g: {
        calories: per.calories,
        protein: per.protein,
        fat: per.fat,
        carbs: per.carbs,
      },
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
              {MEAL_LABELS[k]}
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

        <div className="hint">
          Logs 1 serving ({svg} per recipe) to {date}.
        </div>

        <div className="row-btns">
          <button className="btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" type="button" onClick={log}>
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
