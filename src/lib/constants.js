export const USDA_API = 'https://api.nal.usda.gov/fdc/v1/foods/search';
export const USDA_KEY = 'DEMO_KEY';

export const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
export const AI_MODEL = 'claude-haiku-4-5';
export const AI_STORAGE_KEY = 'rep_fit:aiConfig';

export const NUTRIENT_IDS = {
  CAL: 1008,
  PROTEIN: 1003,
  FAT: 1004,
  CARBS: 1005,
  FIBER: 1079,
  SUGAR: 2000,
  SODIUM: 1093,
};

export const MICRO_KEYS = ['fiber', 'sugar', 'sodium'];
export const MICRO_LABELS = { fiber: 'Fiber', sugar: 'Sugar', sodium: 'Sodium' };
export const MICRO_UNITS = { fiber: 'g', sugar: 'g', sodium: 'mg' };

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
  waterTarget: 8,
};

export const BLANK_DAY = () => ({
  meals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
  weight: null,
  steps: 0,
  water: 0,
  notes: '',
  measurements: {},
  workouts: [],
  cardio: [],
  photos: [],
});

export const MEASUREMENT_KEYS = ['waist', 'chest', 'arms', 'hips', 'thighs', 'neck'];
export const MEASUREMENT_LABELS = {
  waist: 'Waist',
  chest: 'Chest',
  arms: 'Arms',
  hips: 'Hips',
  thighs: 'Thighs',
  neck: 'Neck',
};

export const CARDIO_TYPES = [
  'Walk',
  'Run',
  'Bike',
  'Elliptical',
  'Rowing',
  'Stairmaster',
  'Swim',
  'HIIT',
  'Other',
];

export const PPL_TEMPLATES = [
  {
    id: 'push',
    name: 'Push',
    exercises: [
      'Bench Press',
      'Overhead Press',
      'Incline DB Press',
      'Lateral Raises',
      'Triceps Pushdown',
      'Triceps Overhead Extension',
    ],
  },
  {
    id: 'pull',
    name: 'Pull',
    exercises: [
      'Deadlift',
      'Pull-Ups',
      'Barbell Row',
      'Cable Row',
      'Face Pulls',
      'Barbell Curl',
      'Hammer Curl',
    ],
  },
  {
    id: 'legs',
    name: 'Legs',
    exercises: [
      'Squat',
      'Romanian Deadlift',
      'Leg Press',
      'Walking Lunges',
      'Leg Curl',
      'Calf Raises',
    ],
  },
  {
    id: 'upper',
    name: 'Upper',
    exercises: ['Bench Press', 'Barbell Row', 'Overhead Press', 'Pull-Ups', 'Barbell Curl', 'Triceps Pushdown'],
  },
  {
    id: 'lower',
    name: 'Lower',
    exercises: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raises'],
  },
  { id: 'custom', name: 'Custom', exercises: [] },
];

export const SERVING_UNITS = [
  { id: 'g', label: 'grams', grams: 1 },
  { id: 'oz', label: 'oz', grams: 28.3495 },
  { id: 'cup', label: 'cup', grams: 240 },
  { id: 'tbsp', label: 'tbsp', grams: 15 },
  { id: 'tsp', label: 'tsp', grams: 5 },
  { id: 'piece', label: 'piece', grams: 50 },
];

export const MEAL_KEYS = ['breakfast', 'lunch', 'dinner', 'snacks'];
export const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

export function mealLabelFor(profile, key) {
  return profile?.settings?.mealLabels?.[key] || MEAL_LABELS[key] || key;
}

export function defaultMealForNow(now = new Date()) {
  const h = now.getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h < 20) return 'dinner';
  return 'snacks';
}

// Back-compat shim so old screens keep building during the Phase 1 rewrite.
// Remove once Today/Food/Weight/Analytics are migrated to profile-aware reads.
export const USER = {
  ...ADRIAN_DEFAULTS,
  programDays: 90,
  weightLossRatePct: 0.9,
  nextDexa: '2026-07-15',
};
