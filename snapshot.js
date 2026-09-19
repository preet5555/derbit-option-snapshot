/**
 * Deribit Options Snapshot — API + Styled HTML + Screenshot
 * ------------------------------------------------------------
 * 1. Pulls live BTC option chain data from Deribit's PUBLIC API
 *    (api endpoints on deribit.com — data-only, not geo-blocked).
 * 2. Renders that data into a locally-built HTML page styled to look
 *    like the Deribit options page (dark theme, calls/strike/puts layout).
 * 3. Screenshots that LOCAL HTML file with Playwright — we never load
 *    the real www.deribit.com website, so the regional trading-platform
 *    block never triggers. Works fine on GitHub's free hosted runners.
 *
 * RUN MANUALLY (test):
 *   node snapshot.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// ---- CONFIG ----------------------------------------------------------
const CURRENCY = 'BTC';
const OUTPUT_DIR = path.join(__dirname, 'snapshots');
const HTML_TMP_PATH = path.join(__dirname, '_rendered_page.html');
const VIEWPORT = { width: 1600, height: 1200 };
const API_BASE = 'https://www.deribit.com/api/v2/public';
// ------------------------------------------------------------------------

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API request failed (${res.status}): ${url}`);
  const data = await res.json();
  if (data.error) throw new Error(`API error: ${JSON.stringify(data.error)}`);
  return data.result;
}

async function getUnderlyingPrice() {
  const result = await fetchJson(`${API_BASE}/get_index_price?index_name=btc_usd`);
  return result.index_price;
}

async function getInstruments() {
  return fetchJson(`${API_BASE}/get_instruments?currency=${CURRENCY}&kind=option&expired=false`);
}

async function getBookSummary() {
  return fetchJson(`${API_BASE}/get_book_summary_by_currency?currency=${CURRENCY}&kind=option`);
}

function pickNearestExpiry(instruments) {
  const now = Date.now();
  const future = instruments.filter((i) => i.expiration_timestamp > now);
  future.sort((a, b) => a.expiration_timestamp - b.expiration_timestamp);
  return future.length ? future[0].expiration_timestamp : null;
}

function fmt(n, decimals = 4) {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  return Number(n).toFixed(decimals).replace(/0+$/, '').replace(/\.$/, '') || '0';
}
function fmtInt(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  return Math.round(n).toLocaleString('en-US');
}
function fmtPct(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  return `${Number(n).toFixed(1)}%`;
}

function buildHtml({ currency, underlyingPrice, expiryLabel, rows }) {
  const rowsHtml = rows.map((r) => {
    const isAtm = r.isAtm;
    return `
      <tr class="${isAtm ? 'atm-row' : ''}">
        <td class="num">${fmtInt(r.call.volume)}</td>
        <td class="num call">${fmt(r.call.bid)}</td>
        <td class="num call">${fmt(r.call.mark)}</td>
        <td class="num call-ask">${fmt(r.call.ask)}</td>
        <td class="num">${fmtPct(r.call.markIv)}</td>
        <td class="num">${fmtInt(r.call.oi)}</td>
        <td class="strike">${fmtInt(r.strike)}</td>
        <td class="num">${fmtInt(r.put.oi)}</td>
        <td class="num">${fmtPct(r.put.markIv)}</td>
        <td class="num put-ask">${fmt(r.put.ask)}</td>
        <td class="num put">${fmt(r.put.mark)}</td>
        <td class="num put">${fmt(r.put.bid)}</td>
        <td class="num">${fmtInt(r.put.volume)}</td>
      </tr>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  :root {
    --bg: #0b0e11;
    --panel: #0f1318;
    --border: #1c2128;
    --text: #d7dade;
    --muted: #7c8a9a;
    --green: #26a879;
    --red: #e0495a;
    --accent: #7b5cf0;
    --header-bg: #12161c;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: 'Segoe UI', Roboto, Arial, sans-serif;
    font-size: 13px;
  }
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 24px;
    background: var(--header-bg);
    border-bottom: 1px solid var(--border);
  }
  .brand { font-weight: 700; font-size: 18px; letter-spacing: 0.5px; }
  .brand span { color: var(--accent); }
  .price-pill {
    background: #161b22;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 6px 14px;
    font-weight: 600;
  }
  .subheader {
    padding: 10px 24px;
    color: var(--muted);
    font-size: 12px;
    border-bottom: 1px solid var(--border);
  }
  table { width: 100%; border-collapse: collapse; }
  thead th {
    background: var(--header-bg);
    color: var(--muted);
    font-weight: 600;
    text-align: center;
    padding: 8px 6px;
    border-bottom: 1px solid var(--border);
    font-size: 11px;
    text-transform: uppercase;
  }
  thead .group-calls { color: var(--green); }
  thead .group-puts { color: var(--red); }
  tbody td {
    text-align: center;
    padding: 7px 6px;
    border-bottom: 1px solid #161a1f;
    font-variant-numeric: tabular-nums;
  }
  tbody tr:nth-child(odd) { background: #0d1116; }
  .strike { font-weight: 700; color: #fff; background: #14181f; }
  .call { color: var(--green); }
  .put { color: var(--red); }
  .call-ask, .put-ask { color: #c9506050; }
  .call-ask { color: #ef6b6b; }
  .put-ask { color: #6bb98a; }
  .atm-row .strike {
    background: var(--accent);
    color: #fff;
  }
  .footer {
    padding: 10px 24px;
    color: var(--muted);
    font-size: 11px;
    border-top: 1px solid var(--border);
  }
</style>
</head>
<body>
  <div class="topbar">
    <div class="brand">D <span>Deribit</span> — ${currency} Options Snapshot</div>
    <div class="price-pill">${currency}: $${fmtInt(underlyingPrice)}</div>
  </div>
  <div class="subheader">Expiry: ${expiryLabel} &nbsp;|&nbsp; Generated: ${new Date().toISOString()}</div>
  <table>
    <thead>
      <tr>
        <th colspan="6" class="group-calls">Calls</th>
        <th>Strike</th>
        <th colspan="6" class="group-puts">Puts</th>
      </tr>
      <tr>
        <th>Volume</th><th>Bid</th><th>Mark</th><th>Ask</th><th>IV</th><th>OI</th>
        <th></th>
        <th>OI</th><th>IV</th><th>Ask</th><th>Mark</th><th>Bid</th><th>Volume</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
  <div class="footer">Data source: Deribit public API (api.deribit.com) — not affiliated with or a copy of the live Deribit website.</div>
</body>
</html>`;
}

async function buildDataset() {
  console.log('Fetching underlying price...');
  const underlyingPrice = await getUnderlyingPrice();

  console.log('Fetching instruments...');
  const instruments = await getInstruments();

  console.log('Fetching book summary (prices, IV, volume, OI)...');
  const bookSummary = await getBookSummary();

  const nearestExpiry = pickNearestExpiry(instruments);
  if (!nearestExpiry) throw new Error('No active option expiries found.');

  const expiryDate = new Date(nearestExpiry);
  const expiryLabel = expiryDate.toUTCString().replace(' GMT', ' UTC');

  const bookByInstrument = new Map(bookSummary.map((b) => [b.instrument_name, b]));

  const relevant = instruments.filter((i) => i.expiration_timestamp === nearestExpiry);

  const byStrike = new Map();
  for (const inst of relevant) {
    const book = bookByInstrument.get(inst.instrument_name) || {};
    const entry = byStrike.get(inst.strike) || {
      strike: inst.strike,
      call: { bid: null, mark: null, ask: null, markIv: null, volume: null, oi: null },
      put: { bid: null, mark: null, ask: null, markIv: null, volume: null, oi: null },
    };
    const side = inst.option_type === 'call' ? 'call' : 'put';
    entry[side] = {
      bid: book.bid_price,
      mark: book.mark_price,
      ask: book.ask_price,
      markIv: book.mark_iv,
      volume: book.volume,
      oi: book.open_interest,
    };
    byStrike.set(inst.strike, entry);
  }

  const rows = Array.from(byStrike.values()).sort((a, b) => a.strike - b.strike);

  // Mark the row closest to the current underlying price, like Deribit's
  // highlighted "current price" row.
  let closestIdx = 0;
  let closestDiff = Infinity;
  rows.forEach((r, idx) => {
    const diff = Math.abs(r.strike - underlyingPrice);
    if (diff < closestDiff) { closestDiff = diff; closestIdx = idx; }
  });
  rows.forEach((r, idx) => { r.isAtm = idx === closestIdx; });

  return { currency: CURRENCY, underlyingPrice, expiryLabel, rows };
}

async function takeSnapshot() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const dataset = await buildDataset();
  const html = buildHtml(dataset);
  fs.writeFileSync(HTML_TMP_PATH, html, 'utf-8');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `deribit-options-${timestamp}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);

  console.log('Rendering HTML with headless browser...');
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();
    await page.goto(`file://${HTML_TMP_PATH}`);
    await page.waitForTimeout(500);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`Saved snapshot: ${filepath}`);
  } finally {
    await browser.close();
    fs.unlinkSync(HTML_TMP_PATH);
  }
}

takeSnapshot().catch((err) => {
  console.error('Snapshot failed:', err.message);
  process.exitCode = 1;
});
