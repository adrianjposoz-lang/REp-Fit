# Notes for Claude

Working notes for future sessions. See `PROJECT.md` for the user-facing project overview.

---

## Planned: Phase 5 — Shared AI proxy (Cloudflare Worker)

Goal: let Adrian share REp-Fit with friends/family without each person needing their own Anthropic API key.

### Approach
1. **Cloudflare Worker** holds Adrian's Anthropic API key server-side (`wrangler secret put ANTHROPIC_API_KEY`). Worker forwards `POST /v1/messages` to `https://api.anthropic.com/v1/messages` with the key injected, and returns the response verbatim.
2. **Shared passcode** header (e.g. `x-repfit-pass`) matched against a second Worker secret — same speed-bump spirit as the existing `repfit` unlock gate. Stops randos who find the Worker URL from burning the budget.
3. **Per-IP daily rate limit** via Cloudflare KV or Durable Objects (e.g. 50 requests/day/IP) so one user can't blow through Adrian's budget.
4. **Optional daily $ cap** — Worker tracks spend in KV, hard-stops when a threshold is hit.

### Client changes (`src/lib/ai.js`)
- Replace `ANTHROPIC_API` constant with the Worker URL.
- Drop `anthropic-dangerous-direct-browser-access` header (not needed — proxy is same-origin-ish from the browser's POV).
- Drop the `x-api-key` header on the client (Worker adds it).
- Add the shared-passcode header; store passcode in `rep_fit:aiConfig` same way the API key is stored today.

### Hybrid opt-out (nice-to-have)
- Keep the existing BYO-key path in Settings as a toggle: "Use my own Anthropic key instead of the shared proxy." Power users get unlimited on their own dime; everyone else uses the proxy.

### Free tier budget
- Workers free tier: 100k requests/day — plenty.
- KV free tier: 100k reads, 1k writes/day — enough for rate-limiting a small friend group.
- Haiku 4.5 at current pricing: ~$0.50–2/user/month at typical usage. Cap total monthly spend in the Worker.

### Files that will change
- New: `worker/src/index.ts` (or `.js`), `worker/wrangler.toml`
- Modified: `src/lib/ai.js` (swap endpoint + headers), `src/screens/Settings.jsx` (passcode field + BYO toggle), `src/lib/constants.js` (Worker URL)
- Modified: `PROJECT.md` changelog → v0.9.0 entry

### Status
Not started. User decided 2026-04-20 to defer until they're ready to actually share the app.
