# REp Fit — Project Docs

Living documentation for Adrian's personal fitness tracker. Update this file whenever the app changes so you can always come back and iterate.

---

## What it is

A mobile-first, private, offline-capable web app for tracking calories, protein, macros, steps, weight, and body-composition progress. Built around the Built-With-Science framework: calories + protein + steps + weight, all four editable targets.

**Live URL:** https://adrianjposoz-lang.github.io/REp-Fit/
**Repo:** https://github.com/adrianjposoz-lang/REp-Fit
**Branch for development:** `claude/adrian-cut-tracker-aJUFy`
**Deployed branch:** `gh-pages` (served by GitHub Pages from `/` root)

---

## Privacy model (important — read this)

- **All data is stored in the browser's localStorage on the device.** Nothing is sent to any server we control.
- **The only network call is to the USDA FoodData Central API** for food search (`DEMO_KEY`, no account).
- The repo is public so GitHub Pages can serve it for free. **The repo contains no personal data** — only the app code. localStorage is per-device, so a visitor's browser cannot see your logs.
- A **password gate** adds a speed-bump so strangers who stumble onto the URL can't use the app. It is *not* bank-grade security; for full isolation use a private host.
- **Multi-profile** support lets you and your wife (or anyone) share the same device/URL with separate data pockets.

### Default password
`repfit` — **change it immediately** from the Settings screen after first unlock.

---

## Tech stack

- **React 18** (functional components, hooks) via **Vite**
- **Recharts** for all charts
- **USDA FoodData Central API** for food search (`DEMO_KEY`)
- **localStorage** for all persistence
- **Web Crypto (SubtleCrypto)** for password hashing (SHA-256)
- **PWA manifest + service worker** for iPhone Home Screen install and offline use
- **Custom CSS** — no UI framework
- **Google Fonts**: Barlow Condensed (display/numbers), DM Sans (body), JetBrains Mono (data)

---

## Deployment

The app deploys via GitHub Actions to the `gh-pages` branch.

- **Trigger:** push to `main` or the feature branch.
- **Workflow:** `.github/workflows/deploy.yml` uses `peaceiris/actions-gh-pages@v4`.
- **Vite base:** `./` (relative) in CI so the app works regardless of repo-name casing.
- **Pages source in GitHub Settings:** "Deploy from a branch" → `gh-pages` → `/ (root)`.

### Re-deploying
Any push to the tracked branch re-runs the workflow. Or run **Actions → Deploy to GitHub Pages → Run workflow**.

### Local development
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ production build
```

---

## Data model (localStorage)

All keys are namespaced under `rep_fit:`.

### `rep_fit:config`
Root config. Shared across profiles.
```json
{
  "passwordHash": "<sha256 hex>",
  "passwordSalt": "<random hex>",
  "profiles": ["adrian", "lisa"],
  "currentProfile": "adrian",
  "createdAt": 1713556800000,
  "version": 2
}
```

### `rep_fit:profile:<id>`
Per-profile data.
```json
{
  "name": "Adrian",
  "settings": {
    "startDate": "2026-04-17",
    "endDate": "2026-07-15",
    "startWeight": 223.1,
    "startBodyFat": 36.9,
    "startFatMass": 82.3,
    "startLeanMass": 133.9,
    "goalWeight": 197,
    "goalBodyFat": 20,
    "calorieTarget": 1600,
    "proteinTarget": 175,
    "fatTarget": 60,
    "carbTarget": 90,
    "stepsTarget": 10000
  },
  "logs": {
    "2026-04-17": {
      "meals": {
        "breakfast": [ { "id": "...", "name": "...", "grams": 100, "calories": 165, "protein": 31, "fat": 3.6, "carbs": 0 } ],
        "lunch":     [ ... ],
        "dinner":    [ ... ],
        "snacks":    [ ... ]
      },
      "weight": 222.4,
      "steps": 8500,
      "notes": ""
    }
  },
  "favorites": [ { "fdcId": 123, "name": "Chicken Breast", "per100g": { "calories": 165, "protein": 31, "fat": 3.6, "carbs": 0 } } ],
  "recent": [ ... up to 20 ],
  "customFoods": []
}
```

### `rep_fit:unlock_until`
Unix ms timestamp. If current time is before this, skip the password prompt.

---

## Directory structure

```
/
├── public/
│   ├── manifest.webmanifest     PWA manifest
│   ├── icon.svg                 App icon (single SVG)
│   └── sw.js                    Service worker
├── src/
│   ├── main.jsx                 Entry, SW registration
│   ├── App.jsx                  Top-level flow (auth → setup → app)
│   ├── styles.css               Design system
│   ├── components/
│   │   ├── BottomNav.jsx
│   │   ├── StatCard.jsx
│   │   ├── ActivityRings.jsx    Apple-style rings
│   │   ├── DateNavigator.jsx    Swipe/arrow between days
│   │   ├── ProfileHeader.jsx    Profile name + gear icon
│   │   ├── MealSection.jsx      Per-meal food list
│   │   └── MacroDonut.jsx       P/C/F donut
│   ├── screens/
│   │   ├── Today.jsx
│   │   ├── Food.jsx
│   │   ├── Weight.jsx
│   │   ├── Analytics.jsx
│   │   ├── Settings.jsx
│   │   ├── Login.jsx
│   │   └── Setup.jsx
│   └── lib/
│       ├── constants.js         Default profile for Adrian
│       ├── dates.js             Date helpers
│       ├── storage.js           Profile-aware storage API
│       ├── auth.js              SHA-256, password utils
│       ├── targets.js           Target math (BF%, projection, compliance)
│       └── usda.js              USDA search
├── index.html
├── vite.config.js
├── package.json
└── .github/workflows/deploy.yml
```

---

## Feature checklist

### ✅ Built (Phase 1)
- [x] Password gate + multi-profile
- [x] Today / Food / Weight / Analytics / Settings screens
- [x] USDA food search with 250ms-debounced autocomplete
- [x] Meals split: Breakfast / Lunch / Dinner / Snacks
- [x] Quick-add: kcal + protein without searching
- [x] Favorites (★ to save; shown first) + Recent foods
- [x] Full macros: protein, fat, carbs + donut + targets
- [x] Activity rings: calories / protein / steps
- [x] Date navigator — view/edit past days
- [x] Editable targets: calories, protein, fat, carbs, steps, start/goal weight, start/end date, body-fat baseline
- [x] Program length is uncapped — set any end date
- [x] Reset data → type `CONFIRM` modal (wipes current profile)
- [x] Export all data as JSON
- [x] Import JSON (merges into current profile)
- [x] PWA manifest + Home-Screen install
- [x] Theme polish: deeper base, activity rings, tighter palette, glass nav
- [x] Toggle-able streak-free UX (no streak counters in Phase 1)

### ✅ Built (Phase 2a)
- [x] Custom food creation (user-defined label nutrients, per-profile)
- [x] Recipe builder (combine ingredients → 1-tap log per serving)
- [x] Copy yesterday / copy-meal-to-day (⋯ menus on Today & meals)
- [x] Serving units: grams, oz, cup, tbsp, tsp, piece
- [x] Water tracker (8-cup ring on Today, configurable target)
- [x] Per-day notes / journal (save on blur, 2000 char max)
- [x] Calendar heat-map of compliance (30-day grid on Analytics)

### ✅ Built (Phase 2b)
- [x] Body measurements (waist, chest, arms, hips, thighs, neck — per-day log, "last seen" callouts)
- [x] Progress photos (file input → client-side resize to 1024px → base64, thumbnail grid, tap-to-preview)
- [x] Workout logger: Push/Pull/Legs/Upper/Lower/Custom templates, sets × reps × weight × RPE, live est-1RM, best-lift history
- [x] Cardio entries (type pill picker + minutes + kcal)
- [x] TDEE calculator + suggested target (14-day rolling, Apply-to-settings button)
- [x] Plateau detector (amber callout when stuck in deficit 14 d)
- [x] Refeed nudge (blue callout after 10+ consecutive deficit days)
- [x] Share-card PNG export (540×720 portrait, SVG→canvas, no deps)

### 🚧 Phase 2c (planned)
- [ ] Apple Health nutrition import
- [ ] Edit custom meal names
- [ ] Code-split bundle (chunk is 645 kB — move Recharts to dynamic import)

### 🌟 Phase 3 (stretch)
- [ ] Micronutrients (fiber, sugar, sodium, iron, etc.)
- [ ] Voice input ("two eggs")
- [ ] Meal photo recognition
- [ ] iCloud Drive backup
- [ ] Native iOS wrapper (Capacitor)
- [ ] Apple Watch companion

---

## How to make changes

1. **Work on the feature branch:** `claude/adrian-cut-tracker-aJUFy`
2. **Local dev:** `npm run dev`
3. **Build:** `npm run build`
4. **Push:** `git push origin claude/adrian-cut-tracker-aJUFy` — GitHub Actions auto-deploys to `gh-pages`.
5. **Update this doc** when you ship anything non-trivial. Always.

### Changing the default password
1. Open the deployed app.
2. Unlock with the current password.
3. Go to **Settings → Security → Change password**.

To reset completely (forgot password): on the device, open DevTools → Application → Local Storage → delete keys under `rep_fit:*`. Or from Safari: Settings → Advanced → Website Data → remove `adrianjposoz-lang.github.io`.

### Adding a new profile
**Settings → Profiles → Add profile.** Enter name. Switches to that profile. Each profile has its own targets and logs.

### Exporting / importing data
- **Settings → Data → Export**: downloads a `.json` file with all profiles + config (minus password hash).
- **Settings → Data → Import**: pick a file; merges into your current profile.

---

## Changelog

- **v0.4.0 (2026-04-19)** — Phase 2b: workout logger (PPL templates, sets/reps/weight, est-1RM, best-lift), body measurements, progress photos (base64, client-resized), cardio, TDEE coach card (14-day rolling), plateau + refeed callouts, share-card PNG export.
- **v0.3.0 (2026-04-19)** — Phase 2a: custom foods, recipes (ingredient builder + 1-tap log), serving units (g/oz/cup/tbsp/tsp/piece), water ring, copy-yesterday + copy-meal, per-day notes, 30-day compliance heatmap.
- **v0.2.0 (2026-04-19)** — Phase 1 rewrite: profiles, password gate, meals, macros, activity rings, settings, autocomplete, PWA, theme polish.
- **v0.1.0 (2026-04-17)** — Initial build per spec: Today, Food, Weight, Analytics, localStorage persistence, Recharts, USDA search.

---

## Known limitations

- USDA `DEMO_KEY` is rate-limited (~30 req/hr). If search silently fails, wait an hour or get a free key at https://api.data.gov/signup/ and drop it into `src/lib/constants.js` → `USDA_KEY`.
- Password gate uses SHA-256 with salt; the hash ships in localStorage and is computed client-side. This deters casual access but is not a real auth system. Don't store medical records here.
- Body-fat % is an estimate: assumes lean mass is preserved. Re-anchor at each DEXA by editing `startFatMass` / `startLeanMass` in Settings.
- iOS Safari localStorage can be purged if the user clears history or if the site is inactive for a very long time. Export regularly.
