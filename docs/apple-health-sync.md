# REp-Fit — Apple Health Sync Setup

One-way Apple Watch / Apple Health → REp-Fit sync using a private GitHub Gist as the data pipe. Free, automatic, no subscriptions.

**What you get:** steps, active calories, weight, and Apple Watch workouts auto-logged to REp-Fit every morning.

**Time needed:** ~10 minutes, one time.

---

## How it works

```
Apple Watch  →  iPhone Health app  →  iOS Shortcut  →  private GitHub Gist  →  REp-Fit
    (data)          (stores data)      (runs daily)        (JSON file)         (fetches + merges)
```

The app pulls from your gist every time you open it. The Shortcut updates the gist every morning. That's it.

---

## Step 1 — Create a private gist (2 min)

1. Go to **https://gist.github.com**
2. **Filename:** `repfit.json`
3. **Content:** paste exactly this:
   ```json
   {"days":{}}
   ```
4. Click the arrow next to the green button → **Create secret gist**
5. Copy the **gist ID** from the URL — it's the long hash after your username.
   Example: `https://gist.github.com/yourname/8f4c2ab9e21b4f9a23b7e8d5c6a1b9e0` → ID is `8f4c2ab9e21b4f9a23b7e8d5c6a1b9e0`

Keep this tab open — you'll need the ID in step 3.

---

## Step 2 — Create a GitHub token (2 min)

1. Go to **https://github.com/settings/tokens?type=beta**
2. Click **Generate new token**
3. **Token name:** `REp-Fit Health Sync`
4. **Expiration:** `No expiration` (or 1 year if you prefer to rotate)
5. **Repository access:** `Public Repositories (read-only)` — this doesn't matter for gists
6. **Permissions → Account → Gists:** `Read and write`
7. Click **Generate token**
8. **Copy the token now** — you'll only see it once. Starts with `github_pat_…`

---

## Step 3 — Paste into REp-Fit (30 sec)

1. Open the REp-Fit app
2. Tap the **⚙️ gear icon** → **Apple Health sync**
3. Paste the **Gist ID** from step 1
4. Paste the **token** from step 2
5. Leave **Auto-sync on open** checked
6. Tap **Save**
7. Tap **Sync now** — you should see "Already up to date" (the gist is empty). That's good.

The token is stored on your device only. It never leaves your phone and it's never included in your exports.

---

## Step 4 — Build the iOS Shortcut (5 min)

Open the **Shortcuts app** on your iPhone and tap **+** to create a new shortcut.

Add these actions **in order**:

### A. Get today's date
- **Date** (action) → Current Date
- **Format Date** → ISO 8601, Date only → gives you `2026-04-19`
- Tap the result → **Rename variable** to `Today`

### B. Get yesterday's steps
- **Find Health Samples Where** → Type: **Steps** → Sort by Start Date → Order: Latest First → Limit: 1 → Start Date: **Yesterday**
- **Get Details of Health Samples** → Value → rename to `Steps`

### C. Get yesterday's active energy
- **Find Health Samples Where** → Type: **Active Energy** → Sort by Start Date → Order: Latest First → Limit: 1 → Start Date: **Yesterday**
- **Get Details of Health Samples** → Value → rename to `ActiveKcal`

### D. Get latest weight
- **Find Health Samples Where** → Type: **Weight** → Sort by Start Date → Order: Latest First → Limit: 1
- **Get Details of Health Samples** → Value → rename to `Weight`

### E. Build the JSON
- **Text** action, contents (using the magic variables you just named):
  ```json
  {"days":{"[Today]":{"steps":[Steps],"activeKcal":[ActiveKcal],"weight":[Weight]}}}
  ```
  Tap each `[Variable]` placeholder and replace it with the actual variable chip.

  *(Note: if you want yesterday's date key instead of today's, run the Format Date action against **Yesterday** instead of **Current Date**.)*

- Rename the result to `NewDay`

### F. Merge with the existing gist (important — don't overwrite!)
- **Get Contents of URL** →
  - URL: `https://api.github.com/gists/YOUR_GIST_ID`
  - Method: `GET`
  - Headers: `Authorization: Bearer YOUR_TOKEN`
- **Get Dictionary from Input** → the response
- **Get Dictionary Value** → `files` → `repfit.json` → `content`
- **Get Dictionary from Input** → merges old `days` with `NewDay.days`

This step is finicky in Shortcuts. **Simplest working alternative:** skip the merge and let your Shortcut *overwrite* with only the last 30 days. Add a "Get Health Samples over the last 30 days" action, loop over each, and build the `days` dict that way. The app will handle merging on its end.

### G. PATCH the gist
- **Text** action, contents:
  ```json
  {"files":{"repfit.json":{"content":"[NewDay as text]"}}}
  ```
  Note the `[NewDay as text]` — you need **Get Text from Input** first to convert the dictionary back to a JSON string.
- **Get Contents of URL** →
  - URL: `https://api.github.com/gists/YOUR_GIST_ID`
  - Method: **PATCH**
  - Headers:
    - `Authorization: Bearer YOUR_TOKEN`
    - `Accept: application/vnd.github+json`
  - Request Body: File → the JSON from the Text action above

### H. Test it
- Tap the **▶︎ Run** button in Shortcuts
- Open REp-Fit → Settings → Apple Health sync → Sync now
- You should see **"Synced · 1 day updated"**
- Go back to Today — yesterday's steps should be filled in

---

## Step 5 — Run it automatically every morning

1. Shortcuts app → **Automation** tab (bottom)
2. **+** → **Time of Day** → `6:00 AM` → `Daily`
3. **Run Immediately** (toggle on, so it doesn't ask for permission each time)
4. **Next** → pick your Shortcut from step 4
5. Done.

From now on, every morning at 6 AM your Shortcut writes yesterday's Watch data to the gist. When you open REp-Fit, it pulls the update automatically.

---

## Troubleshooting

**"Gist not found"**
- Double-check the ID — it's the long hash in the URL, not your username.
- Make sure the token has **Gists: Read and write** permission.

**"GitHub API 401"**
- Token expired or the wrong one was pasted. Regenerate in step 2.

**"Gist content is not valid JSON"**
- Open the gist on github.com, click Edit, and make sure the content is valid JSON (brackets matched, no trailing commas).

**Shortcut runs but REp-Fit doesn't update**
- Tap **Sync now** in Settings — it should surface the error.
- Open the gist on github.com to check the raw content looks right.

**Steps keep being overwritten by zero**
- Your Shortcut is writing `steps: 0` because the Health query returned nothing. Check the date range filter — it needs to be **Yesterday** (full day), not **Today**.

---

## What gets synced, and what doesn't

| Data                        | Direction         | Merge rule                                                      |
|-----------------------------|-------------------|-----------------------------------------------------------------|
| **Steps**                   | Watch → App       | Overwrite (Watch wins — more accurate)                          |
| **Active calories**         | Watch → App       | Stored alongside day                                            |
| **Weight**                  | Watch → App       | Only fills **blank** days (never overrides your manual entries) |
| **Workouts (Watch)**        | Watch → App       | Append to day's cardio, dedupe by type + minutes                |
| **Food / meals**            | N/A               | Stays in REp-Fit only                                           |
| **Notes, measurements, lifting sets** | N/A      | REp-Fit only                                                    |

Sync is **one-way**. Nothing leaves REp-Fit back to Apple Health.

---

## Privacy

- The gist is **secret** (`https://gist.github.com/…` is not indexed, but anyone with the URL can read it — treat it like an unlisted YouTube link).
- The **token** lives on your device in `localStorage`. It's never exported when you back up your REp-Fit data.
- GitHub sees your data pass through. If that bothers you, use the Health Auto Export paid app (~$5/mo) with a Cloudflare Worker instead — not yet built in REp-Fit.

---

## Quick reference — Shortcut summary

```
INPUT:  Date.today, Health(steps, active kcal, weight), Health(workouts)
BUILD:  {"days":{"2026-04-19":{"steps":12480,"activeKcal":520,"weight":221.4,"workouts":[...]}}}
OUTPUT: PATCH https://api.github.com/gists/YOUR_ID
        Headers: Authorization: Bearer YOUR_TOKEN
        Body:    {"files":{"repfit.json":{"content":"<JSON>"}}}
```

That's the whole sync.
