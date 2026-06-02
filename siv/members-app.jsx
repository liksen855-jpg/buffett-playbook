// ── Members dashboard — app root ─────────────────────────────────────────────
const { useState, useEffect, useRef } = React;
const { PulseBar, Watchlist, NewsFeed, EarningsList, look } = window.MemberParts;
const { PicksFeed, PresetsCard, PortfolioCard } = window.MemberFeatures;
const { fmtPrice: dFmtPrice, fmtCap: dFmtCap, fmtVol: dFmtVol, yieldOf: dYield } = window.ScreenerParts;

const MTWEAKS = /*EDITMODE-BEGIN*/{
  "density": "comfortable",
  "accent": "#2C6191"
}/*EDITMODE-END*/;

const WL_KEY = "members.watchlist.v1";
function loadWL() {
  try { const v = JSON.parse(localStorage.getItem(WL_KEY)); if (Array.isArray(v)) return v; } catch (e) {}
  return [...window.DEFAULT_WATCHLIST];
}

function Dash() {
  const [t, setTweak] = useTweaks(MTWEAKS);
  const [watchlist, setWatchlist] = useState(loadWL);
  const [portfolio, setPortfolio] = useState(() => window.PORTFOLIO); // seed fallback
  const [scope, setScope] = useState("watchlist");
  const [selected, setSelected] = useState(null);
  const meLoaded = useRef(false);
  const saveTimer = useRef(null);

  // Load this patron's saved watchlist + portfolio from their account (KV).
  useEffect(() => {
    let cancel = false;
    fetch("/api/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (cancel) return;
        if (d && d.authenticated && d.data) {
          if (Array.isArray(d.data.watchlist)) setWatchlist(d.data.watchlist);
          if (d.data.portfolio) setPortfolio(d.data.portfolio);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancel) meLoaded.current = true; });
    return () => { cancel = true; };
  }, []);

  // Persist on change — localStorage immediately + debounced write to the account.
  // Gated on meLoaded so the initial defaults don't clobber the saved copy.
  useEffect(() => {
    localStorage.setItem(WL_KEY, JSON.stringify(watchlist));
    if (!meLoaded.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/me", {
        method: "PUT", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchlist, portfolio }),
      }).catch(() => {});
    }, 700);
  }, [watchlist, portfolio]);

  const addTicker = (sym) => setWatchlist((l) => l.includes(sym) ? l : [sym, ...l]);
  const removeTicker = (sym) => setWatchlist((l) => l.filter((s) => s !== sym));

  const root = { "--accent": t.accent, "--accent-soft": t.accent + "1A", "--accent-line": t.accent + "33" };
  const cls = ["dash", "density-" + t.density].join(" ");
  const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className={cls} style={root}>
      <header className="appbar">
        <div className="brand">
          <span className="brand-dot" />
          <span className="brand-name">Screener</span>
        </div>
        <nav className="nav">
          <a className="nav-link nav-on" href="/terminal">Dashboard</a>
          <a className="nav-link" href="/screener">Screener</a>
        </nav>
        <div className="appbar-spacer" />
        <div className="market-state"><span className="ms-dot" />Market open</div>
        <div className="appbar-date">{today}</div>
        <div className="avatar">JM</div>
      </header>

      <PulseBar />

      <div className="dash-body">
        <main className="dash-main">
          <PicksFeed onSelect={setSelected} />
          <NewsFeed list={watchlist} scope={scope} setScope={setScope} onSelect={setSelected} />
        </main>
        <aside className="dash-rail">
          <Watchlist list={watchlist} onAdd={addTicker} onRemove={removeTicker} onSelect={setSelected} />
          <EarningsList list={watchlist} />
          <PresetsCard />
          <PortfolioCard portfolio={portfolio} onChange={setPortfolio} />
        </aside>
      </div>

      {selected && <DetailPeek stock={selected} watched={watchlist.includes(selected.symbol)} onToggle={() => watchlist.includes(selected.symbol) ? removeTicker(selected.symbol) : addTicker(selected.symbol)} onClose={() => setSelected(null)} />}

      <TweaksPanel>
        <TweakSection label="Display" />
        <TweakRadio label="Density" value={t.density} options={["comfortable", "compact"]} onChange={(v) => setTweak("density", v)} />
        <TweakSection label="Theme" />
        <TweakColor label="Accent" value={t.accent} options={["#2C6191", "#1F7A6B", "#4B4FB0", "#475569", "#9A5B2E"]} onChange={(v) => setTweak("accent", v)} />
      </TweaksPanel>
    </div>
  );
}

function DetailPeek({ stock: s, watched, onToggle, onClose }) {
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
          <span className="num">${dFmtPrice(s.price)}</span>
          <span className={"num peek-chg " + (up ? "chg-pos" : "chg-neg")}>{up ? "▲ +" : "▼ "}{s.changePct.toFixed(2)}%</span>
        </div>
        <div className="peek-grid">
          <Row k="Market cap" v={dFmtCap(s.marketCap)} />
          <Row k="Volume" v={dFmtVol(s.volume)} />
          <Row k="Beta" v={s.beta != null ? s.beta.toFixed(2) : "—"} />
          <Row k="Div yield" v={dYield(s) ? dYield(s).toFixed(2) + "%" : "—"} />
        </div>
        <div className="peek-actions">
          <button className={"peek-watch" + (watched ? " is-watched" : "")} onClick={onToggle}>
            {watched ? "✓ On watchlist" : "+ Add to watchlist"}
          </button>
          <a className="peek-open" href="/screener">Open in screener →</a>
        </div>
      </div>
    </div>
  );
}

// Mount is deferred: the page bootstrap calls this once the Patreon gate passes
// and live FMP data has loaded (window.IIData.load()).
window.__bootApp = () => ReactDOM.createRoot(document.getElementById("root")).render(<Dash />);
