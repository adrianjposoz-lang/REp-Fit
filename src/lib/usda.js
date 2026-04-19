import { USDA_API, USDA_KEY, NUTRIENT_IDS } from './constants.js';

function extract(food) {
  const n = { calories: 0, protein: 0, fat: 0, carbs: 0 };
  for (const nutri of food.foodNutrients || []) {
    const id = nutri.nutrientId ?? nutri.nutrient?.id;
    const val = nutri.value ?? nutri.amount ?? 0;
    if (id === NUTRIENT_IDS.CAL) n.calories = val;
    else if (id === NUTRIENT_IDS.PROTEIN) n.protein = val;
    else if (id === NUTRIENT_IDS.FAT) n.fat = val;
    else if (id === NUTRIENT_IDS.CARBS) n.carbs = val;
  }
  return n;
}

const cache = new Map(); // query -> array

export async function searchFoods(query, { signal, pageSize = 20 } = {}) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  if (cache.has(q)) return cache.get(q);
  const url = `${USDA_API}?query=${encodeURIComponent(q)}&pageSize=${pageSize}&api_key=${USDA_KEY}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`USDA API ${res.status}`);
  const data = await res.json();
  const foods = (data.foods || []).map((f) => ({
    fdcId: f.fdcId,
    name: f.description,
    brand: f.brandName || f.brandOwner || '',
    per100g: extract(f),
  }));
  cache.set(q, foods);
  return foods;
}
