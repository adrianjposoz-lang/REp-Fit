export const USDA_API = 'https://api.nal.usda.gov/fdc/v1/foods/search';
export const USDA_KEY = 'DEMO_KEY';

export const NUTRIENT_IDS = {
  CAL: 1008,
  PROTEIN: 1003,
  FAT: 1004,
  CARBS: 1005,
};

export const DEFAULT_PASSWORD = 'repfit';

export const ADRIAN_DEFAULTS = {
  name: 'Adrian',
  startDate: '2026-04-17',
  endDate: '2026-07-15',
  startWeight: 223.1,
  startBodyFat: 36.9,
  startFatMass: 82.3,
  startLeanMass: 133.9,
  visceralFat: 3.35,
  goalWeight: 197,
  goalBodyFat: 20,
  calorieTarget: 1600,
  proteinTarget: 175,
  fatTarget: 60,
  carbTarget: 90,
  stepsTarget: 10000,
};

export const BLANK_DAY = () => ({
  meals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
  weight: null,
  steps: 0,
  notes: '',
});

export const MEAL_KEYS = ['breakfast', 'lunch', 'dinner', 'snacks'];
export const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

// Back-compat shim so old screens keep building during the Phase 1 rewrite.
// Remove once Today/Food/Weight/Analytics are migrated to profile-aware reads.
export const USER = {
  ...ADRIAN_DEFAULTS,
  programDays: 90,
  weightLossRatePct: 0.9,
  nextDexa: '2026-07-15',
};
