// ── InsightInvest · curated + personal seeds ─────────────────────────────────
// Editorial / personal data with no FMP equivalent. Live market data (STOCKS,
// PULSE values, NEWS, EARNINGS, BREADTH) is filled in by data/live.js after the
// Patreon gate passes. Empty placeholders below keep top-level module code that
// reads these globals from crashing before the async load resolves.

window.STOCKS        = window.STOCKS        || [];
window.STOCK_BY_SYM  = window.STOCK_BY_SYM  || {};
window.NEWS          = window.NEWS          || [];
window.EARNINGS      = window.EARNINGS      || [];
window.BREADTH       = window.BREADTH       || { advancers: 0, decliners: 0, unchanged: 0 };

// Market-pulse tiles — labels/units/kind are fixed; value + changePct are
// overwritten live by data/live.js (matched on `sym`).
window.PULSE = [
  { label: "S&P 500", sym: "SPX", value: 0, changePct: 0, kind: "index" },
  { label: "Nasdaq",  sym: "NDX", value: 0, changePct: 0, kind: "index" },
  { label: "Dow",     sym: "DJI", value: 0, changePct: 0, kind: "index" },
  { label: "Russell", sym: "RUT", value: 0, changePct: 0, kind: "index" },
  { label: "VIX",     sym: "VIX", value: 0, changePct: 0, kind: "vol",   invert: true },
  { label: "10Y",     sym: "TNX", value: 0, changePct: 0, kind: "rate",  unit: "%" },
  { label: "Crude",   sym: "CL",  value: 0, changePct: 0, kind: "cmdty", unit: "$" },
  { label: "Gold",    sym: "GC",  value: 0, changePct: 0, kind: "cmdty", unit: "$" },
  { label: "Bitcoin", sym: "BTC", value: 0, changePct: 0, kind: "crypto",unit: "$" },
];

// Quality Picks — curated editorial. Price/change are pulled live via look().
window.PICKS = [
  { symbol: "NVDA", score: 94, sentiment: "Bullish", sentimentScore: 88, conviction: "High",
    narrative: 86, tags: ["AI infrastructure", "Margin expansion"],
    thesis: "Data-center revenue still accelerating into Blackwell ramp; supply, not demand, remains the gating factor. Gross margins holding above 70%." },
  { symbol: "LLY", score: 91, sentiment: "Bullish", sentimentScore: 84, conviction: "High",
    narrative: 88, tags: ["GLP-1 cycle", "Pricing power"],
    thesis: "Incretin franchise compounding faster than capacity can absorb. Manufacturing build-out de-risks the multi-year demand curve." },
  { symbol: "AVGO", score: 88, sentiment: "Bullish", sentimentScore: 80, conviction: "High",
    narrative: 82, tags: ["Custom silicon", "Recurring software"],
    thesis: "Custom-ASIC backlog with hyperscalers plus VMware's subscription conversion broadens the moat beyond merchant networking." },
  { symbol: "JPM", score: 85, sentiment: "Bullish", sentimentScore: 71, conviction: "Medium",
    narrative: 79, tags: ["Net interest income", "Buybacks"],
    thesis: "Fortress balance sheet earns through a softer rate path; capital return accelerates as Basel endgame finalizes lighter than feared." },
  { symbol: "COST", score: 83, sentiment: "Neutral", sentimentScore: 58, conviction: "High",
    narrative: 84, tags: ["Membership moat", "Rich valuation"],
    thesis: "Renewal rates and membership fee leverage are best-in-class; the only debate is price, not quality. Premium multiple is earned but full." },
  { symbol: "PANW", score: 80, sentiment: "Bullish", sentimentScore: 75, conviction: "Medium",
    narrative: 72, tags: ["Platformization", "Net retention"],
    thesis: "Platform consolidation strategy is converting point-product customers into multi-module contracts, lifting net retention and ARR durability." },
  { symbol: "XOM", score: 76, sentiment: "Neutral", sentimentScore: 52, conviction: "Medium",
    narrative: 68, tags: ["Capital returns", "Range-bound oil"],
    thesis: "Low-cost Guyana and Permian barrels fund a durable dividend and buyback even with crude range-bound. Less torque, more ballast." },
  { symbol: "ABBV", score: 74, sentiment: "Bullish", sentimentScore: 69, conviction: "Medium",
    narrative: 66, tags: ["Post-Humira", "Immunology"],
    thesis: "Skyrizi and Rinvoq have absorbed the Humira cliff faster than the Street modeled; immunology growth re-rates the dividend story." },
];

// Saved screens — curated; link into the screener.
window.PRESETS = [
  { name: "High-yield large caps", desc: "Cap ≥ $10B · yield ≥ 3%", count: 14, accent: "#2C6191" },
  { name: "Momentum semis",        desc: "Semiconductors · +chg · beta > 1.3", count: 6,  accent: "#1F7A6B" },
  { name: "Low-beta dividend",     desc: "Beta < 0.7 · dividend payers", count: 11, accent: "#4B4FB0" },
  { name: "Oversold quality",      desc: "Chg < −2% · mega/large cap", count: 9,  accent: "#9A5B2E" },
];

// Portfolio — personal holdings (no FMP source). Value/P&L computed from live price.
window.PORTFOLIO = {
  cash: 12480,
  holdings: [
    { symbol: "AAPL", shares: 120, avgCost: 168.40 },
    { symbol: "NVDA", shares: 300, avgCost:  78.20 },
    { symbol: "MSFT", shares:  60, avgCost: 322.10 },
    { symbol: "JPM",  shares:  90, avgCost: 178.30 },
    { symbol: "LLY",  shares:  18, avgCost: 612.00 },
    { symbol: "COST", shares:  15, avgCost: 720.50 },
    { symbol: "AMD",  shares: 140, avgCost: 122.60 },
  ],
};

window.DEFAULT_WATCHLIST = ["AAPL", "NVDA", "TSLA", "JPM", "AMD", "COIN"];
