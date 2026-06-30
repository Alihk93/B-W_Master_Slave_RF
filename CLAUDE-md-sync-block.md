# Dashboard sync — imported into CLAUDE.md

This repo is tracked in the IoT Project Command Center dashboard. Running
`npm run sync` (or any `git push`, via the pre-push hook) writes **pm-sync.json**
— a small file holding this project's git status. Import it in the dashboard to
merge into the matching project (matched by repo, then code); other projects are
never touched.

## Rule for Claude Code
After meaningful work, keep the dashboard current:
1. Run `npm run sync` (writes pm-sync.json from real `git log` + open issues).
2. If genuine progress happened, you may also note it for the user to reflect in
   the dashboard (move tasks to done, bump a phase) — but pm-sync.json itself only
   carries git fields; task/phase edits are made in the dashboard.
3. Commit pm-sync.json:  git add pm-sync.json && git commit -m "chore: sync dashboard"

## Refresh the dashboard
Dashboard → Import → pm-sync.json. New repos auto-create their project entry on
first import; existing ones just get their commit/issue fields updated.
