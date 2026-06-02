// =============================================================
//  SCREENER V2 — full 28-filter engine (standalone /screener)
//  Depends on host helpers: getFmpKey, fmpFetch, esc, fmtN, fmtCap, selectResult
// =============================================================

const SCR_CAP_MAP = {
  mega:  { more: 200e9,  less: null  },
  large: { more: 10e9,   less: 200e9 },
  mid:   { more: 2e9,    less: 10e9  },
  small: { more: 300e6,  less: 2e9   },
  micro: { more: null,   less: 300e6 },
};

let _screenerSort = { col: 'marketCap', dir: 'desc' };
let _screenerData = [];   // enriched + filtered results
let _screenerRaw  = [];   // enriched results before client filter

// ── UI helpers ──────────────────────────────────────────────
function scr_switchCat(cat, btn) {
  document.querySelectorAll('.scr-cat-pane').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.scr-cat-btn').forEach(b => b.classList.remove('active'));
  const pane = document.getElementById('scr-cat-' + cat);
  if (pane) pane.style.display = 'grid';
  if (btn) btn.classList.add('active');
}

function scr_getFilters() {
  const gv = id => document.getElementById(id)?.value || '';
  return {
    // Descriptive (server-side)
    sector:    gv('scr-sector'),
    industry:  gv('scr-industry'),
    mktcap:    gv('scr-mktcap'),
    priceMin:  gv('scr-price-min'),
    priceMax:  gv('scr-price-max'),
    volMin:    gv('scr-vol-min'),
    betaMin:   gv('scr-beta-min'),
    betaMax:   gv('scr-beta-max'),
    divMin:    gv('scr-div-min'),
    etf:       gv('scr-etf'),
    active:    gv('scr-active'),
    limit:     gv('scr-limit') || '50',
    // Technical (client-side — from quote batch)
    epsMin:    gv('scr-eps-min'),
    w52:       gv('scr-52w'),
    chgMin:    gv('scr-chg-min'),
    chgMax:    gv('scr-chg-max'),
    // Fundamental (client-side — from key-metrics + income batch)
    peMin:          gv('scr-pe-min'),
    peMax:          gv('scr-pe-max'),
    evEbitdaMax:    gv('scr-evebitda-max'),
    pfcfMax:        gv('scr-pfcf-max'),
    fcfYieldMin:    gv('scr-fcfyield-min'),
    roeMin:         gv('scr-roe-min'),
    roicMin:        gv('scr-roic-min'),
    deMax:          gv('scr-de-max'),
    crMin:          gv('scr-cr-min'),
    gmMin:          gv('scr-gm-min'),
    omMin:          gv('scr-om-min'),
    nmMin:          gv('scr-nm-min'),
    revGrowthMin:   gv('scr-revgrowth-min'),
    epsGrowthMin:   gv('scr-epsgrowth-min'),
  };
}

// P/E and EPS need income/ratios (not in /quote), so they live in the fund path.
function scr_needsFundEnrich(f) {
  return f.epsMin || f.peMin || f.peMax || f.evEbitdaMax || f.pfcfMax || f.fcfYieldMin ||
         f.roeMin || f.roicMin || f.deMax || f.crMin || f.gmMin || f.omMin || f.nmMin ||
         f.revGrowthMin || f.epsGrowthMin;
}

// Active filter badge pills
function scr_updateBadges() {
  const f = scr_getFilters();
  const pills = [];
  const add = (label, clearFn) => pills.push({ label, clearFn });
  const cl  = (id, val='') => () => { const el = document.getElementById(id); if (el) el.value = val; scr_updateBadges(); };

  if (f.sector)       add(`Sector: ${f.sector}`,             cl('scr-sector'));
  if (f.industry)     add(`Industry: ${f.industry}`,         cl('scr-industry'));
  if (f.mktcap)       add(`Cap: ${f.mktcap}`,                cl('scr-mktcap'));
  if (f.priceMin)     add(`Price ≥ $${f.priceMin}`,          cl('scr-price-min'));
  if (f.priceMax)     add(`Price ≤ $${f.priceMax}`,          cl('scr-price-max'));
  if (f.volMin)       add(`Vol ≥ ${Number(f.volMin).toLocaleString()}`, cl('scr-vol-min'));
  if (f.betaMin)      add(`Beta ≥ ${f.betaMin}`,             cl('scr-beta-min'));
  if (f.betaMax)      add(`Beta ≤ ${f.betaMax}`,             cl('scr-beta-max'));
  if (f.divMin)       add(`Div ≥ ${f.divMin}%`,              cl('scr-div-min'));
  if (f.epsMin)       add(`EPS ≥ $${f.epsMin}`,              cl('scr-eps-min'));
  if (f.w52)          add(`52W: ${f.w52}`,                   cl('scr-52w'));
  if (f.chgMin)       add(`Chg ≥ ${f.chgMin}%`,              cl('scr-chg-min'));
  if (f.chgMax)       add(`Chg ≤ ${f.chgMax}%`,              cl('scr-chg-max'));
  if (f.peMin)        add(`P/E ≥ ${f.peMin}`,                cl('scr-pe-min'));
  if (f.peMax)        add(`P/E ≤ ${f.peMax}`,                cl('scr-pe-max'));
  if (f.evEbitdaMax)  add(`EV/EBITDA ≤ ${f.evEbitdaMax}`,    cl('scr-evebitda-max'));
  if (f.pfcfMax)      add(`P/FCF ≤ ${f.pfcfMax}`,            cl('scr-pfcf-max'));
  if (f.fcfYieldMin)  add(`FCF yield ≥ ${f.fcfYieldMin}%`,   cl('scr-fcfyield-min'));
  if (f.roeMin)       add(`ROE ≥ ${f.roeMin}%`,              cl('scr-roe-min'));
  if (f.roicMin)      add(`ROIC ≥ ${f.roicMin}%`,            cl('scr-roic-min'));
  if (f.deMax)        add(`D/E ≤ ${f.deMax}`,                cl('scr-de-max'));
  if (f.crMin)        add(`Curr. ratio ≥ ${f.crMin}`,        cl('scr-cr-min'));
  if (f.gmMin)        add(`Gross margin ≥ ${f.gmMin}%`,      cl('scr-gm-min'));
  if (f.omMin)        add(`Op. margin ≥ ${f.omMin}%`,        cl('scr-om-min'));
  if (f.nmMin)        add(`Net margin ≥ ${f.nmMin}%`,        cl('scr-nm-min'));
  if (f.revGrowthMin) add(`Rev growth ≥ ${f.revGrowthMin}%`, cl('scr-revgrowth-min'));
  if (f.epsGrowthMin) add(`EPS growth ≥ ${f.epsGrowthMin}%`, cl('scr-epsgrowth-min'));
  if (f.etf === 'true') add('No ETFs', cl('scr-etf', 'true'));

  const wrap = document.getElementById('scr-active-badges');
  if (!wrap) return;
  wrap.innerHTML = pills.length
    ? pills.map((p, i) => `<span class="scr-badge">${esc(p.label)}<span class="scr-badge-x" onclick="scr_clearBadge(${i})">×</span></span>`).join('')
    : '<span class="scr-badge-empty">No filters applied — showing the broad universe.</span>';
  wrap._clearFns = pills.map(p => p.clearFn);
}

function scr_clearBadge(i) {
  const wrap = document.getElementById('scr-active-badges');
  if (wrap?._clearFns?.[i]) wrap._clearFns[i]();
}

function scr_resetFilters() {
  const selects = ['scr-sector','scr-mktcap','scr-etf','scr-active','scr-52w'];
  selects.forEach(id => { const el = document.getElementById(id); if (el) el.value = (id === 'scr-etf' || id === 'scr-active') ? 'true' : ''; });
  const inputs = ['scr-industry','scr-price-min','scr-price-max','scr-vol-min',
    'scr-beta-min','scr-beta-max','scr-div-min','scr-eps-min',
    'scr-chg-min','scr-chg-max','scr-pe-min','scr-pe-max','scr-evebitda-max',
    'scr-pfcf-max','scr-fcfyield-min','scr-roe-min','scr-roic-min','scr-de-max',
    'scr-cr-min','scr-gm-min','scr-om-min','scr-nm-min',
    'scr-revgrowth-min','scr-epsgrowth-min'];
  inputs.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  scr_updateBadges();
  const st = document.getElementById('screener-status'); if (st) st.textContent = '';
  const rs = document.getElementById('screener-results'); if (rs) rs.innerHTML = '';
  _screenerData = []; _screenerRaw = [];
}

// ── Enrichment — batch quote + fundamentals ─────────────────
async function scr_batchQuote(symbols) {
  if (!symbols.length) return {};
  const data = await fmpFetch(`/quote?symbol=${symbols.join(',')}`);
  const map = {};
  if (Array.isArray(data)) data.forEach(q => { if (q.symbol) map[q.symbol] = q; });
  return map;
}
async function scr_batchKeyMetrics(symbols) {
  if (!symbols.length) return {};
  const results = await Promise.allSettled(symbols.map(sym => fmpFetch(`/key-metrics?symbol=${sym}&limit=2`)));
  const map = {};
  results.forEach((r, i) => { if (r.status === 'fulfilled' && Array.isArray(r.value) && r.value.length) map[symbols[i]] = r.value; });
  return map;
}
async function scr_batchIncome(symbols) {
  if (!symbols.length) return {};
  const results = await Promise.allSettled(symbols.map(sym => fmpFetch(`/income-statement?symbol=${sym}&limit=2`)));
  const map = {};
  results.forEach((r, i) => { if (r.status === 'fulfilled' && Array.isArray(r.value) && r.value.length) map[symbols[i]] = r.value; });
  return map;
}
// /ratios holds D/E, P/FCF, P/E (not present in /key-metrics on the stable tier)
async function scr_batchRatios(symbols) {
  if (!symbols.length) return {};
  const results = await Promise.allSettled(symbols.map(sym => fmpFetch(`/ratios?symbol=${sym}&limit=1`)));
  const map = {};
  results.forEach((r, i) => { if (r.status === 'fulfilled' && Array.isArray(r.value) && r.value.length) map[symbols[i]] = r.value; });
  return map;
}

function scr_mergeEnrichment(rows, quoteMap, metricsMap, incomeMap, ratioMap) {
  const pctScale = v => v == null ? null : (Math.abs(v) < 2 ? v * 100 : v); // 0.15→15, 15→15
  return rows.map(d => {
    const q  = quoteMap[d.symbol]   || {};
    const km = (metricsMap[d.symbol] || [])[0] || {};
    const inc = incomeMap[d.symbol] || [];
    const r0  = (ratioMap[d.symbol]  || [])[0] || {};
    const i0 = inc[0] || {};
    const i1 = inc[1] || {};

    const price  = d.price  || q.price  || 0;
    const volume = d.volume || q.volume || 0;
    const chgPct = q.changePercentage ?? q.changesPercentage ?? d.changePercentage ?? null;
    const yHigh  = q.yearHigh || 0;
    const yLow   = q.yearLow  || 0;
    const w52pos = (yHigh > yLow && price > 0) ? ((price - yLow) / (yHigh - yLow)) * 100 : null;

    // EPS / PE — quote has neither; use income EPS (epsDiluted) + ratios PE
    const eps = (i0.epsDiluted ?? i0.epsdiluted ?? i0.eps) ?? null;
    const pe  = r0.priceToEarningsRatio ?? (price && eps && eps > 0 ? price / eps : null);

    const evEbitda  = km.evToEBITDA ?? km.enterpriseValueOverEBITDA ?? null;
    const pfcf      = r0.priceToFreeCashFlowRatio ?? r0.priceToFreeCashFlowsRatio ?? null;
    const fcfYield  = pctScale(km.freeCashFlowYield ?? null);
    const roe       = pctScale(km.returnOnEquity ?? km.roe ?? null);
    const roic      = pctScale(km.returnOnInvestedCapital ?? km.roic ?? null);
    const de        = r0.debtToEquityRatio ?? km.debtToEquity ?? null;
    const cr        = km.currentRatio ?? r0.currentRatio ?? null;

    const rev0 = i0.revenue || 0;
    const rev1 = i1.revenue || 0;
    const gm = rev0 > 0 ? (i0.grossProfit     || 0) / rev0 * 100 : null;
    const om = rev0 > 0 ? (i0.operatingIncome || 0) / rev0 * 100 : null;
    const nm = rev0 > 0 ? (i0.netIncome       || 0) / rev0 * 100 : null;
    const revGrowth = (rev1 > 0 && rev0 > 0) ? (rev0 - rev1) / rev1 * 100 : null;
    const e0 = i0.epsDiluted ?? i0.epsdiluted ?? 0;
    const e1 = i1.epsDiluted ?? i1.epsdiluted ?? 0;
    const epsGrowth = (e1 !== 0 && e0 !== 0) ? (e0 - e1) / Math.abs(e1) * 100 : null;

    return {
      ...d, price, volume,
      eps, pe, changePercentage: chgPct,
      yearHigh: yHigh, yearLow: yLow, w52position: w52pos,
      roe, roic, evEbitda, pfcf, fcfYield,
      debtEquity: de, currentRatio: cr,
      grossMargin: gm, operatingMargin: om, netMargin: nm,
      revenueGrowth: revGrowth, epsGrowth,
    };
  });
}

// ── Client-side filtering ───────────────────────────────────
function scr_clientFilter(rows, f) {
  const n = s => s !== '' && s !== null && s !== undefined ? parseFloat(s) : null;
  return rows.filter(d => {
    if (n(f.epsMin)    !== null && (d.eps ?? 0) < n(f.epsMin)) return false;
    if (n(f.chgMin)    !== null && (d.changePercentage ?? 0) < n(f.chgMin)) return false;
    if (n(f.chgMax)    !== null && (d.changePercentage ?? 0) > n(f.chgMax)) return false;
    if (n(f.peMin)     !== null && (d.pe ?? 999) < n(f.peMin)) return false;
    if (n(f.peMax)     !== null && (d.pe ?? 999) > n(f.peMax)) return false;

    if (f.w52 === 'near-high' && (d.w52position ?? 50) < 80) return false;
    if (f.w52 === 'near-low'  && (d.w52position ?? 50) > 20) return false;
    if (f.w52 === 'mid'       && ((d.w52position ?? 50) < 20 || (d.w52position ?? 50) > 80)) return false;

    if (n(f.evEbitdaMax)  !== null && (d.evEbitda ?? 999) > n(f.evEbitdaMax)) return false;
    if (n(f.pfcfMax)      !== null && (d.pfcf ?? 999) > n(f.pfcfMax)) return false;
    if (n(f.fcfYieldMin)  !== null && (d.fcfYield ?? 0) < n(f.fcfYieldMin)) return false;
    if (n(f.roeMin)       !== null && (d.roe ?? 0) < n(f.roeMin)) return false;
    if (n(f.roicMin)      !== null && (d.roic ?? 0) < n(f.roicMin)) return false;
    if (n(f.deMax)        !== null && (d.debtEquity ?? 999) > n(f.deMax)) return false;
    if (n(f.crMin)        !== null && (d.currentRatio ?? 0) < n(f.crMin)) return false;
    if (n(f.gmMin)        !== null && (d.grossMargin ?? 0) < n(f.gmMin)) return false;
    if (n(f.omMin)        !== null && (d.operatingMargin ?? 0) < n(f.omMin)) return false;
    if (n(f.nmMin)        !== null && (d.netMargin ?? 0) < n(f.nmMin)) return false;
    if (n(f.revGrowthMin) !== null && (d.revenueGrowth ?? 0) < n(f.revGrowthMin)) return false;
    if (n(f.epsGrowthMin) !== null && (d.epsGrowth ?? 0) < n(f.epsGrowthMin)) return false;
    return true;
  });
}

// ── Main run ────────────────────────────────────────────────
async function runScreener() {
  const key = getFmpKey();
  const statusEl = document.getElementById('screener-status');
  if (!key) { if (statusEl) statusEl.textContent = 'Add your FMP key first.'; return; }

  const btn = document.querySelector('.scr-run-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Screening…'; }
  if (statusEl) statusEl.textContent = '';
  document.getElementById('screener-results').innerHTML = '';

  const f = scr_getFilters();

  // Step 1: server-side screener
  const params = new URLSearchParams({ limit: f.limit, exchange: 'NYSE,NASDAQ,AMEX' });
  if (f.sector)            params.set('sector', f.sector);
  if (f.industry)          params.set('industry', f.industry);
  if (f.priceMin)          params.set('priceMoreThan', f.priceMin);
  if (f.priceMax)          params.set('priceLowerThan', f.priceMax);
  if (f.volMin)            params.set('volumeMoreThan', f.volMin);
  if (f.betaMin)           params.set('betaMoreThan', f.betaMin);
  if (f.betaMax)           params.set('betaLowerThan', f.betaMax);
  if (f.divMin)            params.set('dividendMoreThan', f.divMin);
  if (f.etf === 'true')    params.set('isEtf', 'false');
  if (f.active === 'true') params.set('isActivelyTrading', 'true');
  const cap = SCR_CAP_MAP[f.mktcap];
  if (cap) {
    if (cap.more !== null) params.set('marketCapMoreThan', cap.more);
    if (cap.less !== null) params.set('marketCapLowerThan', cap.less);
  }

  let rows = [];
  try {
    if (statusEl) statusEl.textContent = 'Step 1/3 · screening…';
    const data = await fmpFetch(`/company-screener?${params.toString()}`);
    rows = Array.isArray(data) ? data : [];
    if (!rows.length) {
      if (statusEl) statusEl.textContent = '0 results — try adjusting filters.';
      if (btn) { btn.disabled = false; btn.textContent = 'Run screener'; }
      document.getElementById('screener-results').innerHTML = '<div class="scr-empty">No results matched your filters.</div>';
      return;
    }
  } catch (e) {
    if (statusEl) statusEl.textContent = `Error: ${e.message}`;
    if (btn) { btn.disabled = false; btn.textContent = 'Run screener'; }
    return;
  }

  const syms = rows.map(r => r.symbol).filter(Boolean);

  // Step 2: quote enrichment (always — for live price + change%)
  let quoteMap = {};
  try {
    if (statusEl) statusEl.textContent = `Step 2/3 · enriching ${syms.length} results with live data…`;
    quoteMap = await scr_batchQuote(syms);
  } catch (e) { console.warn('Quote enrichment failed:', e.message); }

  // Step 3: fundamentals enrichment (only if a fundamental filter is set)
  let metricsMap = {}, incomeMap = {}, ratioMap = {};
  if (scr_needsFundEnrich(f)) {
    try {
      if (statusEl) statusEl.textContent = `Step 3/3 · fetching fundamentals (${syms.length} tickers)…`;
      [metricsMap, incomeMap, ratioMap] = await Promise.all([
        scr_batchKeyMetrics(syms), scr_batchIncome(syms), scr_batchRatios(syms),
      ]);
    } catch (e) { console.warn('Fundamentals enrichment failed:', e.message); }
  }

  const enriched = scr_mergeEnrichment(rows, quoteMap, metricsMap, incomeMap, ratioMap);
  const filtered = scr_clientFilter(enriched, f);
  _screenerRaw = enriched; _screenerData = filtered;

  const count  = filtered.length;
  const funds_ = Object.keys(metricsMap).length > 0;
  const live_  = Object.keys(quoteMap).length > 0;
  const badge  = live_ ? (funds_ ? ' · fundamentals loaded' : ' · live prices loaded') : '';
  if (statusEl) statusEl.textContent =
    `${count} result${count !== 1 ? 's' : ''}${count === parseInt(f.limit) ? ` (limit ${f.limit})` : ''}${badge}`;

  renderScreenerTable(_screenerData);
  if (btn) { btn.disabled = false; btn.textContent = 'Run screener'; }
}

// ── Render ──────────────────────────────────────────────────
function scr_mktcapTier(cap) {
  if (!cap) return null;
  if (cap >= 200e9) return { label: 'Mega',  cls: 'scr-tier-mega'  };
  if (cap >= 10e9)  return { label: 'Large', cls: 'scr-tier-large' };
  if (cap >= 2e9)   return { label: 'Mid',   cls: 'scr-tier-mid'   };
  if (cap >= 300e6) return { label: 'Small', cls: 'scr-tier-small' };
  return                   { label: 'Micro', cls: 'scr-tier-micro' };
}
function scr_fmtPct(v, d=1) { if (v === null || v === undefined || isNaN(v)) return '—'; return (v >= 0 ? '+' : '') + v.toFixed(d) + '%'; }
function scr_fmtMult(v, d=1) { if (v === null || v === undefined || isNaN(v) || !isFinite(v)) return '—'; return v.toFixed(d) + '×'; }
function scr_rvClass(rv) { if (!rv) return 'scr-rv-norm'; if (rv >= 3) return 'scr-rv-hot'; if (rv >= 1.5) return 'scr-rv-warm'; return 'scr-rv-norm'; }

function renderScreenerTable(data) {
  const wrap = document.getElementById('screener-results');
  if (!data.length) { wrap.innerHTML = '<div class="scr-empty">No results matched your filters.<br>Try relaxing some criteria.</div>'; return; }

  const hasQuote = data.some(d => d.changePercentage != null);
  const hasFund  = data.some(d => d.grossMargin != null || d.roe != null || d.pe != null);

  const { col, dir } = _screenerSort;
  const sorted = [...data].sort((a, b) => {
    let av = a[col], bv = b[col];
    if (typeof av === 'string' || typeof bv === 'string') {
      av = (av || '').toLowerCase(); bv = (bv || '').toLowerCase();
      return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    av = av ?? (dir === 'asc' ? Infinity : -Infinity);
    bv = bv ?? (dir === 'asc' ? Infinity : -Infinity);
    return dir === 'asc' ? av - bv : bv - av;
  });

  const cols = [
    { key: 'symbol', label: 'Ticker', always: true, th: 'text-align:left',
      td: d => `<td class="sym" style="cursor:pointer">${esc(d.symbol)}</td>` },
    { key: 'companyName', label: 'Company', always: true, th: 'text-align:left',
      td: d => `<td style="max-width:180px;overflow:hidden;text-overflow:ellipsis">${esc(d.companyName || '')}</td>` },
    { key: 'sector', label: 'Sector', always: true, th: 'text-align:left',
      td: d => `<td style="color:var(--muted);font-size:11.5px">${esc(d.sector || '—')}</td>` },
    { key: 'price', label: 'Price', always: true, th: 'text-align:right',
      td: d => `<td class="mono" style="text-align:right">$${fmtN(d.price)}</td>` },
    { key: 'changePercentage', label: 'Chg %', show: hasQuote, th: 'text-align:right',
      td: d => { const v = d.changePercentage; const cls = v === null ? '' : v >= 0 ? 'chg-pos' : 'chg-neg';
        return `<td class="mono ${cls}" style="text-align:right">${v !== null ? (v >= 0 ? '+' : '') + v.toFixed(2) + '%' : '—'}</td>`; } },
    { key: 'marketCap', label: 'Mkt cap', always: true, th: 'text-align:right',
      td: d => { const t = scr_mktcapTier(d.marketCap);
        return `<td style="text-align:right">$${fmtCap(d.marketCap)}${t ? `<span class="scr-tier ${t.cls}">${t.label}</span>` : ''}</td>`; } },
    { key: 'volume', label: 'Volume', always: true, th: 'text-align:right',
      td: d => `<td style="text-align:right">${fmtCap(d.volume)}</td>` },
    { key: 'beta', label: 'Beta', always: true, th: 'text-align:right',
      td: d => `<td class="mono" style="text-align:right">${d.beta != null ? d.beta.toFixed(2) : '—'}</td>` },
    { key: 'pe', label: 'P/E', show: hasFund, th: 'text-align:right',
      td: d => `<td class="mono" style="text-align:right">${d.pe != null && d.pe > 0 ? d.pe.toFixed(1) + '×' : '—'}</td>` },
    { key: 'evEbitda', label: 'EV/EBITDA', show: hasFund, th: 'text-align:right',
      td: d => `<td class="mono" style="text-align:right">${scr_fmtMult(d.evEbitda)}</td>` },
    { key: 'roe', label: 'ROE', show: hasFund, th: 'text-align:right',
      td: d => `<td class="mono" style="text-align:right;color:${d.roe >= 15 ? 'var(--green)' : d.roe < 0 ? 'var(--red)' : 'inherit'}">${d.roe !== null ? d.roe.toFixed(1) + '%' : '—'}</td>` },
    { key: 'grossMargin', label: 'Gross M', show: hasFund, th: 'text-align:right',
      td: d => `<td class="mono" style="text-align:right">${d.grossMargin !== null ? d.grossMargin.toFixed(1) + '%' : '—'}</td>` },
    { key: 'operatingMargin', label: 'Op. M', show: hasFund, th: 'text-align:right',
      td: d => `<td class="mono" style="text-align:right">${d.operatingMargin !== null ? d.operatingMargin.toFixed(1) + '%' : '—'}</td>` },
    { key: 'revenueGrowth', label: 'Rev growth', show: hasFund, th: 'text-align:right',
      td: d => { const v = d.revenueGrowth; const cls = v === null ? '' : v >= 0 ? 'chg-pos' : 'chg-neg';
        return `<td class="mono ${cls}" style="text-align:right">${scr_fmtPct(v)}</td>`; } },
    { key: 'lastAnnualDividend', label: 'Div ($)', always: true, th: 'text-align:right',
      td: d => `<td style="text-align:right">${d.lastAnnualDividend ? '$' + d.lastAnnualDividend.toFixed(2) : '—'}</td>` },
  ].filter(c => c.always || c.show);

  const thCells = cols.map(c => {
    const isSorted = _screenerSort.col === c.key;
    const cls = isSorted ? `sort-${_screenerSort.dir}` : '';
    return `<th class="${cls}" onclick="sortScreener('${c.key}')" style="${c.th}">${c.label}</th>`;
  }).join('');

  const trs = sorted.map(d => `<tr onclick="selectResult('${esc(d.symbol)}')">${cols.map(c => c.td(d)).join('')}</tr>`).join('');

  wrap.innerHTML = `
    <div style="overflow-x:auto;border:1px solid var(--border);border-radius:8px;background:var(--panel)">
      <table class="screener-table">
        <thead><tr>${thCells}</tr></thead>
        <tbody>${trs}</tbody>
      </table>
    </div>`;
}

function sortScreener(col) {
  _screenerSort = { col, dir: _screenerSort.col === col && _screenerSort.dir === 'desc' ? 'asc' : 'desc' };
  renderScreenerTable(_screenerData);
}
