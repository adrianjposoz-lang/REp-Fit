// Open Food Facts lookup — free public API, no key needed.
// Returns a food object shaped like USDA results so it can be passed
// straight into QuickAddSheet.

export async function lookupBarcode(code) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open Food Facts ${res.status}`);
  const data = await res.json();
  if (data.status !== 1 || !data.product) {
    throw new Error('Product not found');
  }
  const p = data.product;
  const n = p.nutriments || {};
  const kcal100 =
    num(n['energy-kcal_100g']) ??
    Math.round((num(n['energy_100g']) || 0) / 4.184);
  const sodiumMg = num(n.sodium_100g)
    ? Math.round(num(n.sodium_100g) * 1000)
    : num(n.salt_100g)
    ? Math.round(num(n.salt_100g) * 400)
    : 0;
  return {
    fdcId: `off:${code}`,
    name: p.product_name || p.generic_name || `Barcode ${code}`,
    brand: p.brands || '',
    per100g: {
      calories: kcal100 || 0,
      protein: num(n.proteins_100g) || 0,
      fat: num(n.fat_100g) || 0,
      carbs: num(n.carbohydrates_100g) || 0,
      fiber: num(n.fiber_100g) || 0,
      sugar: num(n.sugars_100g) || 0,
      sodium: sodiumMg,
    },
  };
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

const searchCache = new Map();

export async function searchOFF(query, { signal, pageSize = 20 } = {}) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const cacheKey = `${q}|${pageSize}`;
  if (searchCache.has(cacheKey)) return searchCache.get(cacheKey);
  const fields = [
    'code',
    'product_name',
    'generic_name',
    'brands',
    'nutriments',
    'countries_tags',
  ].join(',');
  const url =
    `https://world.openfoodfacts.org/api/v2/search` +
    `?search_terms=${encodeURIComponent(q)}` +
    `&page_size=${pageSize}` +
    `&fields=${fields}` +
    `&sort_by=popularity_key`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Open Food Facts ${res.status}`);
  const data = await res.json();
  const products = Array.isArray(data.products) ? data.products : [];
  const out = products
    .map(normalizeOFFProduct)
    .filter((p) => p && p.name && p.per100g.calories > 0);
  searchCache.set(cacheKey, out);
  return out;
}

function normalizeOFFProduct(p) {
  if (!p) return null;
  const n = p.nutriments || {};
  const kcal100 =
    num(n['energy-kcal_100g']) ??
    (num(n['energy_100g']) ? Math.round(num(n['energy_100g']) / 4.184) : 0);
  const sodiumMg = num(n.sodium_100g)
    ? Math.round(num(n.sodium_100g) * 1000)
    : num(n.salt_100g)
    ? Math.round(num(n.salt_100g) * 400)
    : 0;
  const name = (p.product_name || p.generic_name || '').trim();
  if (!name) return null;
  return {
    fdcId: `off:${p.code}`,
    name,
    brand: (p.brands || '').split(',')[0]?.trim() || '',
    per100g: {
      calories: kcal100 || 0,
      protein: num(n.proteins_100g) || 0,
      fat: num(n.fat_100g) || 0,
      carbs: num(n.carbohydrates_100g) || 0,
      fiber: num(n.fiber_100g) || 0,
      sugar: num(n.sugars_100g) || 0,
      sodium: sodiumMg,
    },
  };
}
