# Notes for Claude

Working notes for future sessions.

App display name: **Forma** (renamed from "REp Fit" in v0.8.5). Repo path, git branch, GitHub Pages URL, and `rep_fit:*` localStorage keys were intentionally NOT renamed — renaming them would break existing users' data, iOS Shortcuts gist filename, and the Pages deploy URL.

- `PROJECT.md` — user-facing project overview + changelog of what's shipped.
- `ROADMAP.md` — parked ideas for future phases. **Check this first when the user asks "what's next" or "what's in memory."** Items move from ROADMAP into the PROJECT.md changelog once they ship.

## Working conventions

- Dev branch: `claude/adrian-cut-tracker-aJUFy`. Commit + push there.
- Live URL: https://adrianjposoz-lang.github.io/REp-Fit/ (GitHub Pages, auto-deploys on push via `.github/workflows/deploy.yml`). Pages URL intentionally stays `REp-Fit` — renaming the repo would break the deploy + the Home Screen bookmark.
- API-key-style secrets (Anthropic, GitHub gist token) live in their own localStorage slots — never inside `profile`, so `exportAll` can't leak them.
- When the user asks for a new feature, propose it in ROADMAP.md first before building, unless it's trivial.
