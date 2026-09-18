/**
 * Deribit Options Page Snapshot Tool
 * ------------------------------------
 * Takes a full-page screenshot of the Deribit options chain page and
 * saves it with a timestamped filename. Designed to be run by cron
 * a few minutes before expiry (Deribit options expire daily at 08:00 UTC).
 *
 * SETUP:
 *   npm init -y
 *   npm install playwright
 *   npx playwright install chromium --with-deps
 *
 * RUN MANUALLY (test):
 *   node snapshot.js
 *
 * SCHEDULE (cron, server timezone assumed UTC — see note below):
 *   crontab -e
 *   55 7 * * * cd /path/to/deribit-snapshot && /usr/bin/node snapshot.js >> snapshot.log 2>&1
 *
 *   This runs every day at 07:55 UTC, five minutes before the 08:00 UTC
 *   Deribit expiry. If your server is NOT set to UTC, convert 08:00 UTC
 *   to your local time first (check: `timedatectl` on Linux, or just run
 *   `date -u` to compare).
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// ---- CONFIG ----------------------------------------------------------
// Change this to the exact currency/page you want. Examples on Deribit:
//   https://www.deribit.com/options/BTC-USD
//   https://www.deribit.com/options/ETH-USD
const TARGET_URL = 'https://www.deribit.com/options/BTC-USD';

const OUTPUT_DIR = path.join(__dirname, 'snapshots');
const VIEWPORT = { width: 1920, height: 1200 };

// Selector to wait for before screenshotting — adjust if Deribit changes
// their markup. This waits for the option chain table rows to be present.
const WAIT_SELECTOR = 'table, [class*="option-chain"], [class*="OptionChain"]';
// ------------------------------------------------------------------------

async function takeSnapshot() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `deribit-options-${timestamp}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);

  console.log(`[${new Date().toISOString()}] Launching browser...`);
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();

    console.log(`Navigating to ${TARGET_URL}`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 60000 });

    // Give the page's JS/websocket-driven table time to populate live data
    try {
      await page.waitForSelector(WAIT_SELECTOR, { timeout: 20000 });
    } catch {
      console.warn('Warning: expected table selector not found, proceeding anyway.');
    }
    await page.waitForTimeout(4000); // settle time for live price updates

    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`Saved snapshot: ${filepath}`);
  } catch (err) {
    console.error('Snapshot failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

takeSnapshot();
