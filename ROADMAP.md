# REp-Fit — Future updates

Parked ideas, in rough priority order. Update this file whenever we agree to ship or defer something. Items move from here into `PROJECT.md` changelog once they land.

---

## Phase 10 — Neon + Vercel backend (cloud sync, real accounts)

**Why:** this is the step that turns Forma from "Adrian's private PWA" into a shippable product. Unlocks multi-device sync, cloud backup, a fast server-side food DB (no USDA rate limits), server-hosted AI so users don't BYO keys, and real accounts with password reset. **Decided 2026-04-20** as the direction after weighing Supabase vs Neon+Vercel; user already has a Neon account and wants the single-vendor Vercel ecosystem.

**Relationship to other phases:**
- **Supersedes Phase 5** (Cloudflare AI proxy) — 10d does the same job on Vercel with one fewer platform. Phase 5 is retired when 10d lands.
- **Prerequisite for Phase 8** (Capacitor). A native iOS app without sync would feel broken.

**Stack:**
- **Neon** — Postgres. Free tier (0.5 GB) fine to start; branching is amazing for dev. Vercel Postgres is Neon under the hood.
- **Vercel** — replaces GitHub Pages as primary host, plus edge API routes and Blob storage.
- **Clerk** — auth (email magic link, Apple Sign In, Google). Free up to 10k MAU; fastest path to real accounts.
- **Drizzle ORM** — type-safe schema + queries in API routes. Lightweight alternative to Prisma.
- **Hono** (or Next.js API routes) — thin HTTP layer. Hono if we stay Vite+SPA; Next if we migrate.

**Rollout (sub-phases, each shippable independently):**

- **10a — Scaffold.** Create Vercel project, link Neon DB, wire Clerk, stub `/api/health` route. Verify cost is $0 and CI still deploys Forma to `forma.vercel.app` alongside existing GitHub Pages deploy.
- **10b — Sync engine.** Drizzle schema (users, profiles, days, meals, weigh_ins, cardio, workouts, custom_foods, recipes, usuals, favorites). `/api/sync/pull` + `/api/sync/push`. Write a `src/lib/sync.js` adapter that wraps the existing `storage.js` — writes still hit localStorage (offline-first), and a debounced background push syncs to the server. Login replaces the password gate; first sign-in shows an "Import existing local data to your account" sheet.
- **10c — Server-side food search.** Move USDA + OFF calls into `/api/foods/search`, cache results in Postgres (7-day TTL). Removes the user-USDA-key input from Settings (we eat the rate-limit cost centrally, amortized across all users). Existing `foodSearchConfig.js` becomes a "legacy override" for offline mode only.
- **10d — Shared AI proxy.** `/api/ai/messages` proxies Anthropic with a server-held key. Replaces Phase 5. Per-user daily cap in Postgres; "bring your own key" stays as a Settings toggle for power users.
- **10e — Photo storage on Vercel Blob.** Moves progress photos off localStorage (currently base64 — the one real bloat risk). Signed upload URLs, per-user quota.

**Conflict resolution:** last-write-wins by `updated_at` timestamp per row, with the device's local `updatedAt` winning ties. Good enough for a single-user-across-devices pattern; no CRDT needed.

**Offline-first stays a hard requirement:** localStorage remains the source of truth on-device. Sync is additive. If the user is offline, the app works exactly like today; pushes retry when connectivity returns.

**Open questions:**
- Keep local-only mode as an option for privacy-first users? Leaning yes — "Skip sign-in, keep everything on this device" button on Login. If they later sign in, same "Import your data" flow kicks in.
- Migrate existing `rep_fit:*` keys silently on first sync, or prompt? Prompt — one-time confirmation sheet.
- Multi-profile model: one Clerk user owns N profiles (current shape), or one Clerk user == one profile and we retire multi-profile? Leaning keep multi-profile — Adrian + wife scenario.

**Cost estimate at launch scale (<1,000 users):**
- Neon free: 0.5 GB storage, 191 compute-hours/month — plenty.
- Vercel Hobby: $0, 100 GB bandwidth, 100 GB-hours function execution.
- Vercel Blob: 1 GB free + 10 GB bandwidth.
- Clerk: free up to 10k MAU.
- Anthropic API: only variable cost; rate-limited server-side per user.
- **Total: $0/month until we outgrow a free tier, then likely $20/month to Vercel Pro + Neon Launch.**

**New files:** `api/` (Vercel route handlers), `drizzle/schema.ts`, `drizzle.config.ts`, `src/lib/sync.js`, `src/lib/cloudStorage.js`, `vercel.json`.

**Modified:** `src/lib/storage.js` (wraps with sync adapter), `src/screens/Login.jsx` (Clerk), `src/screens/Setup.jsx` (becomes a post-signup onboarding step), `package.json`.

**Eventually removed:** `src/lib/foodSearchConfig.js` (server handles keys), most of `src/lib/healthSync.js` (proper API replaces the gist hack — HealthKit via Capacitor in Phase 8).

---

## Phase 5 — Shared AI proxy (Cloudflare Worker) — **SUPERSEDED by Phase 10d**

**Status:** parked in favor of the Vercel-hosted proxy that ships as part of Phase 10d. Keeping this entry for historical context only.

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

## Phase 9 — Lock Screen Live Activity for rest timer

**Why:** the single feature that makes REp-Fit feel like a real iOS app. Rest countdown ticks on your lock screen between sets so you don't have to open the app and find the workout tab every 90 seconds. Also shows up on Dynamic Island on supported iPhones.

**Depends on:** Phase 6 (rest timer must exist) and Phase 8 (Capacitor / native iOS wrapper required — Live Activities are an iOS-native API, not available to PWAs).

**Plan:**
- Implement the Live Activity with ActivityKit on the Swift side (small Swift widget target in the Xcode project).
- Capacitor bridge plugin exposing `startRestTimer({seconds, exerciseName})` / `stopRestTimer()` to JS — the web side calls it when a set is logged.
- Live Activity view: exercise name, countdown ring, "Skip" + "+30s" buttons wired back through the bridge.
- Dynamic Island compact/expanded variants for newer iPhones.
- Fall back gracefully on web / Android — if the bridge plugin isn't available, just run the existing in-app timer.

**Files:** new `ios/App/RestTimerWidget/` (Swift), new `src/lib/restTimerNative.js` (bridge shim), edits in whatever component fires the rest timer in Phase 6.

---

## Deferred / maybe-never

Things we considered and set aside:

- **Progressive overload tracking** — auto-suggest next-session weights. User said "doesn't matter" 2026-04-20.
- **Meal planning / weekly prep** — auto-generate a shopping list from target macros. User said "doesn't matter" 2026-04-20.
- **Weekly review screen** — summary UI with charts. Partly covered now by Phase 4 AI coach; revisit only if the AI coach doesn't feel sufficient.

---

## Logging conventions

When an item ships, move its entry from this file into `PROJECT.md`'s changelog with a version bump. When a new idea surfaces, add it here first — don't start building until we've agreed on scope in this file.
