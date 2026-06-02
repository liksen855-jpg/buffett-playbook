// ── InsightInvest · live FMP data loader ─────────────────────────────────────
// Fills the market globals (STOCKS, STOCK_BY_SYM, PULSE values, NEWS, EARNINGS,
// BREADTH) from FMP. Exposes window.IIData.load() — the page bootstrap awaits it
// AFTER the Patreon gate passes, then mounts React (window.__bootApp).
//
// Editorial/personal globals (PICKS, PRESETS, PORTFOLIO, DEFAULT_WATCHLIST) are
// curated in data/seed.js and left untouched here.

(function () {
  const FMP_BASE = "https://financialmodelingprep.com/stable";
  const fmpKey = () => localStorage.getItem("ii_fmp_key") || "n2TIc6JypdMUhyFVtxrdqDBv0dIsK2Zg";
  async function fmp(path) {
    const sep = path.includes("?") ? "&" : "?";
    const r = await fetch(`${FMP_BASE}${path}${sep}apikey=${fmpKey()}`);
    if (!r.ok) throw new Error("FMP " + r.status);
    return r.json();
  }
  const chunk = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; };
  const relAge = (ds) => {
    if (!ds) return "";
    const diff = Date.now() - new Date(String(ds).replace(" ", "T")).getTime();
    const m = Math.floor(diff / 60000);
    if (isNaN(m)) return "";
    if (m < 60) return Math.max(1, m) + "m";
    const h = Math.floor(m / 60);
    if (h < 24) return h + "h";
    return Math.floor(h / 24) + "d";
  };
  const mapSent = (s) => {
    s = String(s || "").toLowerCase();
    if (s.includes("pos") || s.includes("bull")) return "pos";
    if (s.includes("neg") || s.includes("bear")) return "neg";
    return "neu";
  };

  // ── Screener universe → window.STOCKS (+ live change% via batched quotes) ──
  async function loadStocks() {
    let rows = [];
    try {
      rows = await fmp("/company-screener?exchange=NASDAQ,NYSE&marketCapMoreThan=2000000000&isActivelyTrading=true&limit=140");
    } catch (e) { /* keep empty */ }
    if (!Array.isArray(rows) || !rows.length) return;

    const stocks = rows.map((r) => ({
      symbol: r.symbol,
      companyName: r.companyName || r.symbol,
      sector: r.sector || "—",
      industry: r.industry || "—",
      price: +r.price || 0,
      changePct: 0,
      marketCap: +r.marketCap || 0,
      volume: +r.volume || 0,
      beta: r.beta != null ? +r.beta : null,
      lastAnnualDividend: +r.lastAnnualDividend || 0,
      isEtf: !!(r.isEtf || r.isFund),
    }));

    // change% (and fresher price/volume) via batched /quote — 50 symbols/call
    const bySym = {};
    await Promise.all(
      chunk(stocks.map((s) => s.symbol), 50).map(async (syms) => {
        try {
          const q = await fmp("/quote?symbol=" + encodeURIComponent(syms.join(",")));
          (Array.isArray(q) ? q : []).forEach((x) => { if (x && x.symbol) bySym[x.symbol] = x; });
        } catch (e) {}
      })
    );
    stocks.forEach((s) => {
      const q = bySym[s.symbol];
      if (q) {
        s.changePct = q.changePercentage ?? q.changesPercentage ?? 0;
        if (q.price) s.price = q.price;
        if (q.volume) s.volume = q.volume;
      }
    });

    window.STOCKS = stocks;
    window.STOCK_BY_SYM = Object.fromEntries(stocks.map((s) => [s.symbol, s]));

    // Breadth computed from the live universe
    const up = stocks.filter((s) => s.changePct > 0).length;
    const dn = stocks.filter((s) => s.changePct < 0).length;
    window.BREADTH = { advancers: up, decliners: dn, unchanged: stocks.length - up - dn };
  }

  // ── Pulse tiles → live index / commodity / rate / crypto quotes ──
  const PULSE_FMP = {
    SPX: ["^GSPC"], NDX: ["^IXIC", "^NDX"], DJI: ["^DJI"], RUT: ["^RUT"],
    VIX: ["^VIX"], TNX: ["^TNX"], CL: ["BZUSD", "CLUSD"], GC: ["GCUSD"], BTC: ["BTCUSD"],
  };
  async function quoteChain(chain) {
    for (const s of chain) {
      try {
        const r = await fmp("/quote?symbol=" + encodeURIComponent(s));
        const q = Array.isArray(r) ? r[0] : r;
        if (q && q.price != null) return q;
      } catch (e) {}
    }
    return null;
  }
  async function loadPulse() {
    await Promise.all(
      (window.PULSE || []).map(async (tile) => {
        const chain = PULSE_FMP[tile.sym];
        if (!chain) return;
        const q = await quoteChain(chain);
        if (!q) return;
        let v = q.price;
        if (tile.sym === "TNX" && v > 20) v = v / 10; // ^TNX often quoted ×10
        tile.value = v;
        tile.changePct = q.changePercentage ?? q.changesPercentage ?? 0;
      })
    );
  }

  // ── High-impact news ──
  async function loadNews() {
    let rows = [];
    try { rows = await fmp("/news/stock-latest?limit=40"); } catch (e) {}
    if (!Array.isArray(rows) || !rows.length) return;
    window.NEWS = rows.slice(0, 30).map((n, i) => ({
      id: i + 1,
      symbol: (n.symbol || "").split(",")[0] || "",
      headline: n.title || "",
      source: n.site || n.publisher || "",
      time: relAge(n.publishedDate || n.date),
      sentiment: mapSent(n.sentiment),
      impact: "med", // FMP has no impact tier; medium keeps it in-feed
    }));
  }

  // ── Earnings calendar (next ~40 days) ──
  async function loadEarnings() {
    const pad = (x) => String(x).padStart(2, "0");
    const d0 = new Date();
    const d1 = new Date(Date.now() + 40 * 864e5);
    const ymd = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    let rows = [];
    try { rows = await fmp(`/earnings-calendar?from=${ymd(d0)}&to=${ymd(d1)}`); } catch (e) {}
    if (!Array.isArray(rows) || !rows.length) return;
    // The calendar spans the whole market; keep only names the dashboard cares
    // about (loaded universe + default watchlist + curated picks) so the
    // watchlist-filtered Earnings card actually has entries.
    const relevant = new Set([
      ...Object.keys(window.STOCK_BY_SYM || {}),
      ...(window.DEFAULT_WATCHLIST || []),
      ...((window.PICKS || []).map((p) => p.symbol)),
    ]);
    window.EARNINGS = rows
      .filter((e) => e.symbol && e.date && relevant.has(e.symbol))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 60)
      .map((e) => {
        const dt = new Date(String(e.date).replace(" ", "T"));
        const when = /before|bmo/i.test(e.time || "") ? "BMO" : "AMC";
        return {
          symbol: e.symbol,
          date: MON[dt.getMonth()] + " " + dt.getDate(),
          dow: DOW[dt.getDay()],
          when,
          epsEst: e.epsEstimated != null ? +e.epsEstimated : 0,
        };
      });
  }

  let _loaded = false;
  window.IIData = {
    async load() {
      if (_loaded) return;
      await loadStocks();                       // first — others/look() depend on STOCK_BY_SYM
      await Promise.allSettled([loadPulse(), loadNews(), loadEarnings()]);
      _loaded = true;
    },
  };
})();
