import { SERVING_UNITS } from './constants.js';

export function unitById(id) {
  return SERVING_UNITS.find((u) => u.id === id) || SERVING_UNITS[0];
}

// Convert an amount in a unit to grams, respecting an optional food-specific
// gramsPerUnit override (e.g., a custom food that says "1 piece = 120g").
export function toGrams(amount, unitId, gramsPerUnit) {
  const a = Number(amount) || 0;
  if (unitId === 'piece' && gramsPerUnit) return a * Number(gramsPerUnit);
  return a * unitById(unitId).grams;
}

// Scale a per-100g nutrient block to a specific gram weight, rounded 1dp.
// Silently scales any missing micro fields to 0.
export function scaleNutrients(per100g, grams) {
  const factor = (Number(grams) || 0) / 100;
  return {
    calories: round1((per100g.calories || 0) * factor),
    protein: round1((per100g.protein || 0) * factor),
    fat: round1((per100g.fat || 0) * factor),
    carbs: round1((per100g.carbs || 0) * factor),
    fiber: round1((per100g.fiber || 0) * factor),
    sugar: round1((per100g.sugar || 0) * factor),
    sodium: round1((per100g.sodium || 0) * factor),
  };
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
