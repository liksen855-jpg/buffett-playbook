// ── Screener App root ────────────────────────────────────────────────────────
const { useState, useMemo, useEffect } = React;
const { fmtPrice, fmtCap, fmtVol, yieldOf, capTier, CAP_TIERS, FilterFields, ActiveBadges, ResultsTable, ResultsCards } = window.ScreenerParts;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "layout": "rail",
  "view": "table",
  "density": "comfortable",
  "applyMode": "live",
  "accent": "#2C6191"
}/*EDITMODE-END*/;

const EMPTY_FILTERS = {
  sector: "", industry: "", mktcap: "",
  priceMin: "", priceMax: "", volMin: "",
  betaMin: "", betaMax: "", divMin: "",
  excludeEtf: true, divOnly: false,
};

function applyFilters(stocks, f, query) {
  const q = query.trim().toLowerCase();
  return stocks.filter((s) => {
    if (f.excludeEtf && s.isEtf) return false;
    if (f.sector && s.sector !== f.sector) return false;
    if (f.industry && !(s.industry || "").toLowerCase().includes(f.industry.trim().toLowerCase())) return false;
    if (f.mktcap) { const t = capTier(s.marketCap); if (!t || t.id !== f.mktcap) return false; }
    if (f.priceMin && s.price < +f.priceMin) return false;
    if (f.priceMax && s.price > +f.priceMax) return false;
    if (f.volMin && s.volume < +f.volMin) return false;
    if (f.betaMin && (s.beta ?? 0) < +f.betaMin) return false;
    if (f.betaMax && (s.beta ?? 0) > +f.betaMax) return false;
    if (f.divMin && yieldOf(s) < +f.divMin) return false;
    if (f.divOnly && !(s.lastAnnualDividend > 0)) return false;
    if (q && !(s.symbol.toLowerCase().includes(q) || s.companyName.toLowerCase().includes(q))) return false;
    return true;
  });
}

function sortRows(rows, sort) {
  const get = (s, col) => col === "yield" ? yieldOf(s) : s[col];
  return [...rows].sort((a, b) => {
    let av = get(a, sort.col), bv = get(b, sort.col);
    if (typeof av === "string" || typeof bv === "string") {
      av = (av || "").toLowerCase(); bv = (bv || "").toLowerCase();
      return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    av = av ?? -Infinity; bv = bv ?? -Infinity;
    return sort.dir === "asc" ? av - bv : bv - av;
  });
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ col: "marketCap", dir: "desc" });
  const [selected, setSelected] = useState(null);

  const live = t.applyMode === "live";
  const set = (k, v) => setFilters((p) => ({ ...p, [k]: v }));
  useEffect(() => { if (live) setApplied(filters); }, [filters, live]);

  const dirty = JSON.stringify(filters) !== JSON.stringify(applied);
  const run = () => setApplied(filters);
  const clearKey = (k) => { const nv = { ...filters, [k]: EMPTY_FILTERS[k] }; setFilters(nv); if (live || !dirty) setApplied(nv); };
  const clearAll = () => { setFilters(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); };

  const results = useMemo(() => sortRows(applyFilters(window.STOCKS, applied, query), sort), [applied, query, sort]);

  const onSort = (col) => setSort((s) => ({ col, dir: s.col === col && s.dir === "desc" ? "asc" : "desc" }));

  const root = {
    "--accent": t.accent,
    "--accent-soft": t.accent + "1A",
    "--accent-line": t.accent + "33",
  };
  const shellCls = ["screener", "layout-" + t.layout, "view-" + t.view, "density-" + t.density].join(" ");

  return (
    <div className={shellCls} style={root}>
      <header className="appbar">
        <div className="brand">
          <span className="brand-dot" />
          <span className="brand-name">Screener</span>
          <span className="brand-tag">EQUITY · US</span>
        </div>
        <div className="search">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.4" /><line x1="9.3" y1="9.3" x2="12.5" y2="12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ticker or company…" />
          {query && <button className="search-x" onClick={() => setQuery("")}>×</button>}
        </div>
        <div className="appbar-meta">{window.STOCKS.length} listed · mock data</div>
      </header>

      <div className="screener-body">
        {t.layout === "rail" && (
          <aside className="rail">
            <div className="rail-head">
              <span>Filters</span>
              <button className="rail-reset" onClick={clearAll}>Reset</button>
            </div>
            <div className="rail-scroll">
              <FilterFields f={filters} set={set} layout="rail" />
            </div>
            {!live && (
              <div className="rail-foot">
                <button className={"run-btn" + (dirty ? " run-dirty" : "")} onClick={run}>{dirty ? "Apply filters" : "Filters applied"}</button>
              </div>
            )}
          </aside>
        )}

        <main className="results-pane">
          {t.layout === "top" && (
            <div className="topbar">
              <FilterFields f={filters} set={set} layout="top" />
              <div className="topbar-actions">
                {!live && <button className={"run-btn" + (dirty ? " run-dirty" : "")} onClick={run}>{dirty ? "Apply filters" : "Applied"}</button>}
                <button className="reset-btn" onClick={clearAll}>Reset filters</button>
              </div>
            </div>
          )}

          <div className="results-head">
            <div className="rh-left">
              <span className="result-count">{results.length}</span>
              <span className="result-label">match{results.length === 1 ? "" : "es"}</span>
              {dirty && !live && <span className="stale-dot" title="Filters changed — apply to update">unapplied changes</span>}
            </div>
            <div className="rh-right">
              <div className="seg">
                <button className={t.view === "table" ? "seg-on" : ""} onClick={() => setTweak("view", "table")} title="Table view">
                  <svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="2" width="12" height="2.2" rx="0.5" fill="currentColor"/><rect x="1" y="6" width="12" height="2.2" rx="0.5" fill="currentColor"/><rect x="1" y="10" width="12" height="2.2" rx="0.5" fill="currentColor"/></svg>
                </button>
                <button className={t.view === "cards" ? "seg-on" : ""} onClick={() => setTweak("view", "cards")} title="Card view">
                  <svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="1" width="5.2" height="5.2" rx="1" fill="currentColor"/><rect x="7.8" y="1" width="5.2" height="5.2" rx="1" fill="currentColor"/><rect x="1" y="7.8" width="5.2" height="5.2" rx="1" fill="currentColor"/><rect x="7.8" y="7.8" width="5.2" height="5.2" rx="1" fill="currentColor"/></svg>
                </button>
              </div>
            </div>
          </div>

          <ActiveBadges f={applied} clear={clearKey} clearAll={clearAll} />

          {results.length === 0 ? (
            <div className="empty">
              <div className="empty-mark">∅</div>
              <div className="empty-title">No matches</div>
              <div className="empty-sub">Your filters are too narrow. Try widening a range or clearing a few.</div>
              <button className="reset-btn" onClick={clearAll}>Clear all filters</button>
            </div>
          ) : t.view === "table" ? (
            <ResultsTable rows={results} sort={sort} onSort={onSort} onSelect={setSelected} />
          ) : (
            <ResultsCards rows={results} onSelect={setSelected} />
          )}
        </main>
      </div>

      {selected && <DetailPeek stock={selected} onClose={() => setSelected(null)} />}

      <TweaksPanel>
        <TweakSection label="Layout" />
        <TweakRadio label="Filter placement" value={t.layout} options={["rail", "top"]} onChange={(v) => setTweak("layout", v)} />
        <TweakRadio label="Results view" value={t.view} options={["table", "cards"]} onChange={(v) => setTweak("view", v)} />
        <TweakRadio label="Density" value={t.density} options={["comfortable", "compact"]} onChange={(v) => setTweak("density", v)} />
        <TweakSection label="Behavior" />
        <TweakRadio label="Apply filters" value={t.applyMode} options={["live", "manual"]} onChange={(v) => setTweak("applyMode", v)} />
        <TweakSection label="Theme" />
        <TweakColor label="Accent" value={t.accent} options={["#2C6191", "#1F7A6B", "#4B4FB0", "#475569", "#9A5B2E"]} onChange={(v) => setTweak("accent", v)} />
      </TweaksPanel>
    </div>
  );
}

// ── Lightweight detail peek (row click) ──────────────────────────────────────
function DetailPeek({ stock: s, onClose }) {
  const up = s.changePct >= 0;
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  const Row = ({ k, v }) => <div className="pk-row"><span>{k}</span><span className="num">{v}</span></div>;
  return (
    <div className="peek-overlay" onClick={onClose}>
      <div className="peek" onClick={(e) => e.stopPropagation()}>
        <div className="peek-head">
          <div>
            <div className="peek-sym">{s.symbol}{s.isEtf && <span className="etf-tag">ETF</span>}</div>
            <div className="peek-name">{s.companyName}</div>
          </div>
          <button className="peek-x" onClick={onClose}>×</button>
        </div>
        <div className="peek-price">
          <span className="num">${fmtPrice(s.price)}</span>
          <span className={"num peek-chg " + (up ? "chg-pos" : "chg-neg")}>{up ? "▲ +" : "▼ "}{s.changePct.toFixed(2)}%</span>
        </div>
        <div className="peek-grid">
          <Row k="Market cap" v={fmtCap(s.marketCap)} />
          <Row k="Volume" v={fmtVol(s.volume)} />
          <Row k="Beta" v={s.beta?.toFixed(2) ?? "—"} />
          <Row k="Div yield" v={yieldOf(s) ? yieldOf(s).toFixed(2) + "%" : "—"} />
          <Row k="Annual div" v={s.lastAnnualDividend ? "$" + s.lastAnnualDividend.toFixed(2) : "—"} />
          <Row k="Sector" v={s.sector === "—" ? "ETF" : s.sector} />
        </div>
        <div className="peek-industry">{s.industry === "—" ? "Exchange-traded fund" : s.industry}</div>
        <div className="peek-note">Mock detail — in the live app this opens the full ticker page.</div>
      </div>
    </div>
  );
}

// Mount is deferred: the page bootstrap calls this once the Patreon gate passes
// and live FMP data has loaded (window.IIData.load()).
window.__bootApp = () => ReactDOM.createRoot(document.getElementById("root")).render(<App />);
