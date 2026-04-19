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
