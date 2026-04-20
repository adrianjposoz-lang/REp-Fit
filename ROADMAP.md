# REp-Fit — Future updates

Parked ideas, in rough priority order. Update this file whenever we agree to ship or defer something. Items move from here into `PROJECT.md` changelog once they land.

---

## Phase 5 — Shared AI proxy (Cloudflare Worker)

**Why:** let Adrian share REp-Fit with friends/family without each person bringing their own Anthropic API key.

**Plan:**
- Cloudflare Worker holds Adrian's Anthropic key as a secret (`wrangler secret put ANTHROPIC_API_KEY`). Forwards `POST /v1/messages` to `api.anthropic.com` with the key injected.
- Shared passcode header (`x-repfit-pass`) matched against a second Worker secret — same speed-bump spirit as the existing `repfit` unlock gate.
- Per-IP daily rate limit via Cloudflare KV or Durable Objects (e.g. 50 requests/day/IP) so one user can't drain the budget.
- Optional daily $ cap in KV, hard-stop when threshold hit.
- Hybrid: Settings toggle "Use my own Anthropic key instead of the shared proxy" so power users can BYO-key for unlimited use.

**Client changes (`src/lib/ai.js`):** swap `ANTHROPIC_API` constant to Worker URL, drop `anthropic-dangerous-direct-browser-access` + `x-api-key` on the client, add passcode header. Passcode stored in `rep_fit:aiConfig` same as the API key today.

**Free-tier budget:** Workers 100k req/day, KV 100k reads + 1k writes/day, Haiku 4.5 ~$0.50–2/user/month.

**New files:** `worker/src/index.ts`, `worker/wrangler.toml`.

---

## Phase 6 — Rest timer + plate calculator (in Workout screen)

**Why:** tiny build, huge daily usefulness. Stops you doing math mid-set.

**Plan:**
- After each logged set, kick off a countdown (defaults: 90s compound / 60s isolation, editable per exercise in Settings).
- Audible beep + vibration on zero; visible progress ring on the active set row.
- Plate calculator next to the weight input: type `135` and it shows `45 + 45 per side` (or `25 + 10 + 5` for odd loads). Barbell weight configurable (default 45 lb, support for 35 / 15 / EZ-curl). Respects units (lb vs kg).

**Files:** new `src/components/RestTimer.jsx`, new `src/lib/plates.js`, edits in `src/screens/Workout.jsx` (or wherever sets are logged) + Settings for defaults.

---

## Phase 7 — "Fits my macros" suggester

**Why:** turns logging from a journal into a decision tool. Given remaining kcal/protein for the day, rank custom foods + usuals + recipes by how well they close the gap.

**Plan:**
- Compute `remaining = { kcal, protein, fat, carbs }` from the day's totals vs. targets.
- Score each item in the user's pool (`customFoods`, `usuals`, `recipes`) by a weighted fit function — prioritize hitting protein without overshooting calories.
- Render as a ranked list on the Food tab (new "Best for today" section above Recent / Favorites) with one-tap log.
- Bonus: let the user pick a meal slot first ("what fits for dinner?") so the remaining budget is computed for the remaining slots only.

**Files:** new `src/lib/fitRank.js`, edits in `src/screens/Food.jsx`.

---

## Phase 8 — Capacitor wrapper for iOS App Store

**Why:** turn the PWA into a real installable app — proper home-screen presence, background sync, nicer share sheet integration, and a path to TestFlight / App Store distribution. **This is Adrian's preferred distribution path** (decided 2026-04-20) — he does not want to walk friends through "Add to Home Screen." Vercel/PWA-only was considered and rejected for that reason.

**Plan:**
- Add Capacitor (`@capacitor/core`, `@capacitor/ios`) and wrap the existing Vite `dist/` as the web asset.
- Xcode project in `ios/` (gitignored except for the config).
- Replace the web-only bits with Capacitor plugins where it matters: `@capacitor/haptics` (replace navigator.vibrate), `@capacitor/camera` (replace `<input type=file capture>` — better iOS UX), `@capacitor/preferences` (optional — keep localStorage for simplicity initially).
- HealthKit integration via `capacitor-health` or a custom plugin — replaces the current Gist-sync hack with native Apple Health reads on app open. Big upgrade over the iOS Shortcut workflow.
- Shipping: TestFlight first (free), App Store later (Apple Developer Program $99/yr).

**Distribution:** TestFlight internal testing → send friends a link, they install like any app, no App Store review. $99/yr Apple Developer. Promote to full App Store only if/when strangers are involved.

**Open questions:**
- Do we need an Android build too? Capacitor supports it for free ($25 one-time Play Store fee), but HealthKit work is iOS-only. Defer unless a friend specifically asks.
- Keep GitHub Pages PWA in parallel, or point everyone at the app? Leaning: keep Pages as the fallback / preview URL.

**Files:** new `capacitor.config.ts`, `ios/` folder, `android/` optional, small edits across components that touch camera / haptics / storage.

---

## Deferred / maybe-never

Things we considered and set aside:

- **Progressive overload tracking** — auto-suggest next-session weights. User said "doesn't matter" 2026-04-20.
- **Meal planning / weekly prep** — auto-generate a shopping list from target macros. User said "doesn't matter" 2026-04-20.
- **Weekly review screen** — summary UI with charts. Partly covered now by Phase 4 AI coach; revisit only if the AI coach doesn't feel sufficient.

---

## Logging conventions

When an item ships, move its entry from this file into `PROJECT.md`'s changelog with a version bump. When a new idea surfaces, add it here first — don't start building until we've agreed on scope in this file.
