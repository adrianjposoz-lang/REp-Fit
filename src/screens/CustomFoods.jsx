import React, { useState } from 'react';
import {
  getCustomFoods,
  addCustomFood,
  updateCustomFood,
  deleteCustomFood,
} from '../lib/storage.js';

const EMPTY = {
  name: '',
  calories: '',
  protein: '',
  fat: '',
  carbs: '',
  gramsPerUnit: '',
};

export default function CustomFoods({ onClose }) {
  const [foods, setFoods] = useState(() => getCustomFoods());
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [toast, setToast] = useState(null);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1400);
  };

  const set = (k) => (e) => {
    const v = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const canSave =
    form.name.trim().length > 0 &&
    form.calories !== '' &&
    form.protein !== '';

  const resetForm = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const save = () => {
    if (!canSave) return;
    const payload = {
      name: form.name.trim(),
      per100g: {
        calories: Number(form.calories) || 0,
        protein: Number(form.protein) || 0,
        fat: Number(form.fat) || 0,
        carbs: Number(form.carbs) || 0,
      },
    };
    if (form.gramsPerUnit !== '' && Number(form.gramsPerUnit) > 0) {
      payload.gramsPerUnit = Number(form.gramsPerUnit);
    }
    if (editingId) {
      setFoods(updateCustomFood(editingId, payload));
      flash('Updated');
    } else {
      setFoods(addCustomFood(payload));
      flash('Saved');
    }
    resetForm();
  };

  const beginEdit = (f) => {
    setEditingId(f.id);
    setForm({
      name: f.name || '',
      calories: f.per100g?.calories ?? '',
      protein: f.per100g?.protein ?? '',
      fat: f.per100g?.fat ?? '',
      carbs: f.per100g?.carbs ?? '',
      gramsPerUnit: f.gramsPerUnit ?? '',
    });
  };

  const remove = (id) => {
    setFoods(deleteCustomFood(id));
    setConfirmId(null);
    if (editingId === id) resetForm();
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
        <div className="settings-title">Custom Foods</div>
        <div style={{ width: 36 }} />
      </header>

      <div className="screen settings-screen">
        <div className="settings-section">
          <div className="settings-section-title">
            {editingId ? 'Edit food' : 'Add food'}
          </div>
          <div className="settings-card">
            <div className="food-form">
              <label className="food-form-row">
                <span>Name</span>
                <input
                  className="auth-input"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="e.g. Homemade granola"
                />
              </label>
              <div className="food-form-grid">
                <label className="food-form-row">
                  <span>Cal / 100g</span>
                  <input
                    className="auth-input"
                    type="number"
                    inputMode="decimal"
                    value={form.calories}
                    onChange={set('calories')}
                  />
                </label>
                <label className="food-form-row">
                  <span>Protein / 100g</span>
                  <input
                    className="auth-input"
                    type="number"
                    inputMode="decimal"
                    value={form.protein}
                    onChange={set('protein')}
                  />
                </label>
                <label className="food-form-row">
                  <span>Fat / 100g</span>
                  <input
                    className="auth-input"
                    type="number"
                    inputMode="decimal"
                    value={form.fat}
                    onChange={set('fat')}
                  />
                </label>
                <label className="food-form-row">
                  <span>Carbs / 100g</span>
                  <input
                    className="auth-input"
                    type="number"
                    inputMode="decimal"
                    value={form.carbs}
                    onChange={set('carbs')}
                  />
                </label>
              </div>
              <label className="food-form-row">
                <span>Grams per piece (optional)</span>
                <input
                  className="auth-input"
                  type="number"
                  inputMode="decimal"
                  value={form.gramsPerUnit}
                  onChange={set('gramsPerUnit')}
                  placeholder="e.g. 120"
                />
              </label>
              <div className="row-btns" style={{ marginTop: 8 }}>
                {editingId ? (
                  <button className="btn-ghost" onClick={resetForm} type="button">
                    Cancel
                  </button>
                ) : (
                  <span />
                )}
                <button
                  className="btn-primary"
                  onClick={save}
                  disabled={!canSave}
                  type="button"
                >
                  {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Your foods</div>
          {foods.length === 0 ? (
            <div className="empty">
              No custom foods yet. Add any recipe staple, protein shake, or
              home-cooked dish here to log it fast later.
            </div>
          ) : (
            <div className="settings-card" style={{ padding: 0 }}>
              {foods.map((f) => (
                <div key={f.id} className="custom-food-row">
                  <div className="cf-info">
                    <div className="cf-name">{f.name}</div>
                    <div className="cf-meta">
                      {Math.round(f.per100g?.calories || 0)} kcal ·{' '}
                      {(f.per100g?.protein || 0).toFixed(1)}P ·{' '}
                      {(f.per100g?.fat || 0).toFixed(1)}F ·{' '}
                      {(f.per100g?.carbs || 0).toFixed(1)}C
                      <span className="muted"> / 100g</span>
                      {f.gramsPerUnit ? (
                        <span className="muted"> · 1pc = {f.gramsPerUnit}g</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="cf-actions">
                    {confirmId === f.id ? (
                      <>
                        <button
                          className="danger-btn sm"
                          type="button"
                          onClick={() => remove(f.id)}
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
                      <>
                        <button
                          className="btn-sm"
                          type="button"
                          onClick={() => beginEdit(f)}
                        >
                          Edit
                        </button>
                        <button
                          className="danger-btn sm"
                          type="button"
                          onClick={() => setConfirmId(f.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
