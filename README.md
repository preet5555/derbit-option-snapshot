# Deribit Options Snapshot — API Data + Styled Screenshot (Free, No Geo-Block)

This version never loads the real Deribit website. Instead it:
1. Pulls live BTC option chain data from **Deribit's public API**
   (`api.deribit.com`-style endpoints — plain data, not the trading platform,
   so it isn't subject to the regional trading restriction).
2. Renders that data into a **locally-built HTML page** styled to look like
   the Deribit options table (dark theme, calls | strike | puts layout).
3. Screenshots that local HTML file with a headless browser.

Because step 3 only opens a file on the runner's own disk — never
`www.deribit.com` — the "Unsupported currency" geo-block never has a chance
to trigger. This runs perfectly fine on GitHub's free hosted servers. No
self-hosted PC, no proxy, no third party needed.

## 1. Create a GitHub repo (skip if you already have one from before)
Public or private both work — public gets unlimited free Actions minutes,
private gets 2,000 free minutes/month (a daily ~2 min job easily fits).

## 2. Upload these files, keeping the folder structure
```
your-repo/
├── snapshot.js
├── package.json
└── .github/
    └── workflows/
        └── main.yml
```
Use "Create new file" and type the full path `.github/workflows/main.yml`
directly into the filename box so GitHub creates the folders correctly
(see earlier troubleshooting notes below if this goes wrong again).

## 3. Turn on write permissions for Actions
Repo → **Settings → Actions → General → Workflow permissions** → select
**"Read and write permissions"** → Save.

## 4. Test it manually
**Actions** tab → **Deribit Options Snapshot** → **Run workflow** → wait
~1-2 minutes → check for a green checkmark.

## 5. Check the result
Refresh the repo → open the new file inside the `snapshots/` folder. It
should show a dark-themed table with the current nearest-expiry BTC option
chain — strikes in the center, calls on the left, puts on the right, with
the row closest to the live BTC price highlighted, similar in spirit to the
real Deribit layout.

## 6. Let the schedule run
From now on, every day at **07:45 UTC (1:15 PM IST)** — 15 minutes before
Deribit's 08:00 UTC expiry — GitHub automatically fetches fresh data and
commits a new snapshot image. No further action needed.

## Notes
- The script currently snapshots the **nearest upcoming expiry** each day.
  If you want a specific expiry instead (e.g. always the weekly Friday one),
  say so and the date-picking logic can be adjusted.
- The visual design is an original recreation for readability — a styled
  table inspired by the layout, not a pixel copy of Deribit's real site.
- If Deribit ever changes their public API's response field names, the
  script's data-parsing section may need small updates — the console log
  in a failed Actions run will show exactly which API call failed.
- Old troubleshooting notes from earlier setup attempts (workflow file
  location issues, cookie banners, geo-block proxying) no longer apply to
  this version, since it doesn't load the live website at all.
