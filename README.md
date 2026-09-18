# Deribit Options Snapshot — Free Setup (GitHub Actions)

No server needed. GitHub runs the script on a schedule for free and saves
the screenshot into your own repo.

## 1. Create a GitHub repo
- Go to github.com → New repository (public is easiest, or private — both
  work, private just uses your monthly free-minutes quota instead of
  unlimited public quota).
- Clone it locally, or just use GitHub's "Upload files" button in the browser.

## 2. Add these files to the repo (same folder structure)
```
your-repo/
├── snapshot.js
├── package.json
└── .github/
    └── workflows/
        └── snapshot.yml
```
Upload/commit `snapshot.js`, `package.json`, and the `.github/workflows/snapshot.yml`
file exactly as-is, keeping that folder path — GitHub only recognizes workflows
placed at `.github/workflows/`.

## 3. Enable Actions (usually on by default)
Go to your repo → **Settings → Actions → General** → make sure "Allow all
actions" is selected, and under **Workflow permissions** select
**"Read and write permissions"** (needed so the job can commit the screenshot
back into the repo).

## 4. Test it manually first
Go to your repo → **Actions** tab → click **"Deribit Options Snapshot"** in
the left sidebar → **"Run workflow"** button → Run. Wait ~2 minutes, then
check the run log. If it succeeds, a `snapshots/` folder with a `.png` will
appear in your repo automatically (refresh the repo page).

## 5. Let the schedule take over
That's it — no further action needed. Every day at **07:45 UTC** (15 minutes
before Deribit's 08:00 UTC expiry), GitHub spins up a temporary machine, runs
the script, and commits the new screenshot to your repo.

> Note: GitHub's scheduled workflows are not military-precise — under heavy
> platform load, runs can be delayed by a few minutes. A 15-minute buffer
> gives good margin so a delayed run still lands well before expiry. If you
> ever need sub-minute precision, a real always-on server (cron) is more
> reliable than free GitHub Actions.

## 6. Viewing your snapshots
All screenshots accumulate in the `snapshots/` folder in your repo's commit
history — browsable anytime on GitHub, or `git pull` to get them locally.

## Free tier limits (for reference)
- **Public repos:** unlimited Actions minutes.
- **Private repos:** 2,000 free minutes/month (GitHub Free plan). Each run
  takes ~2-3 minutes, so a daily job uses roughly 60-90 minutes/month —
  well within the free quota.

## Things that can break this (same as before)
- A cookie-consent banner or promo overlay on Deribit's page could cover the
  table in the screenshot — check the first test run's image.
- If any columns require being logged in, that needs an added session-login
  step (not plain credentials in the file).
- If Deribit changes their page's HTML structure, the `WAIT_SELECTOR` in
  `snapshot.js` may need updating.
