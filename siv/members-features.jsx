// ── Members dashboard — feature modules (picks, presets, portfolio) ──────────
const { Card: MCard, look: mLook, signed: mSigned, fmtMoney: mMoney } = window.MemberParts;
const { fmtPrice: mFmtPrice, fmtCap: mFmtCap, Sparkline: MSpark } = window.ScreenerParts;

// ── Quality Picks (signature) ────────────────────────────────────────────────
const SENT_TONE = { Bullish: "tone-pos", Neutral: "tone-neu", Bearish: "tone-neg" };
const CONV_N = { High: 3, Medium: 2, Low: 1 };

function ScoreRing({ score, size = 52 }) {
  const r = (size - 6) / 2, c = 2 * Math.PI * r;
  const off = c * (1 - score / 100);
  const hue = score >= 85 ? "var(--green)" : score >= 75 ? "var(--accent)" : "var(--warn)";
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border2)" strokeWidth="4" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={hue} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} transform={`rotate(-90 ${size/2} ${size/2})`} />
      </svg>
      <span className="ring-num num">{score}</span>
    </div>
  );
}

function Dimension({ label, value, tone, text }) {
  return (
    <div className="dim">
      <div className="dim-top">
        <span className="dim-label">{label}</span>
        <span className={"dim-val " + (tone || "")}>{text != null ? text : value}</span>
      </div>
      <div className="dim-track"><span className={"dim-fill " + (tone || "")} style={{ width: value + "%" }} /></div>
    </div>
  );
}

function ConvDots({ level }) {
  const n = CONV_N[level] || 0;
  return (
    <span className="conv" title={level + " conviction"}>
      {[1,2,3].map((i) => <span key={i} className={"conv-dot " + (i <= n ? "on" : "")} />)}
      <span className="conv-label">{level}</span>
    </span>
  );
}

function PickCard({ pick, rank, featured, onSelect }) {
  const s = mLook(pick.symbol);
  const up = s.changePct >= 0;
  const tone = SENT_TONE[pick.sentiment];
  return (
    <article className={"pick" + (featured ? " pick-featured" : "")}
      title={`Open ${pick.symbol} research`}
      onClick={() => window.open('/stock-details?ticker=' + encodeURIComponent(pick.symbol), '_blank', 'noopener')}>
      <div className="pick-rank">#{rank}</div>
      <div className="pick-main">
        <div className="pick-head">
          <div className="pick-id">
            <span className="pick-sym">{pick.symbol}</span>
            <span className="pick-name">{s.companyName}</span>
            <span className="pick-sector">{s.sector}</span>
          </div>
          <ScoreRing score={pick.score} size={featured ? 60 : 50} />
        </div>
        <p className="pick-thesis">{pick.thesis}</p>
        <div className="pick-dims">
          <Dimension label="Narrative" value={pick.narrative} />
          <Dimension label="Sentiment" value={pick.sentimentScore} tone={tone} text={pick.sentiment} />
        </div>
        <div className="pick-foot">
          <ConvDots level={pick.conviction} />
          <div className="pick-tags">{pick.tags.map((t) => <span key={t} className="pick-tag">{t}</span>)}</div>
          <div className="pick-px">
            <MSpark symbol={s.symbol} changePct={s.changePct} w={56} h={20} />
            <span className="num pick-price">${mFmtPrice(s.price)}</span>
            <span className={"num pick-chg " + (up ? "chg-pos" : "chg-neg")}>{mSigned(s.changePct)}%</span>
          </div>
        </div>
      </div>
    </article>
  );
}

// Editorial picks. `picks` is the shared global list; the owner (isOwner) gets an
// inline editor whose changes persist to /api/picks for all members to view.
function PicksFeed({ picks, isOwner, onChange, onSelect }) {
  const [editing, setEditing] = React.useState(false);
  const list = Array.isArray(picks) ? picks : [];
  const ip = { height: 28, border: "1px solid var(--border2)", borderRadius: 6, padding: "0 8px", font: "inherit", fontSize: 12, outline: "none", minWidth: 0, width: "100%", background: "var(--panel)", color: "var(--fg)" };
  const upd = (i, k, v) => { const n = list.slice(); n[i] = { ...n[i], [k]: v }; onChange(n); };
  const remove = (i) => { const n = list.slice(); n.splice(i, 1); onChange(n); };
  const add = () => onChange([...list, { symbol: "", score: 75, sentiment: "Bullish", sentimentScore: 70, conviction: "Medium", narrative: 70, tags: [], thesis: "" }]);

  return (
    <MCard title="Quality Picks" sub="Scored on narrative · sentiment · conviction"
      action={isOwner
        ? <button className="card-action" onClick={() => setEditing((e) => !e)}>{editing ? "Done" : "Edit"}</button>
        : <span className="card-stamp">Updated today</span>}
      className="card-picks">
      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {list.map((p, i) => (
            <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "12px 13px", display: "flex", flexDirection: "column", gap: 8, background: "var(--strip)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 1fr 1fr 26px", gap: 8, alignItems: "center" }}>
                <input style={ip} placeholder="TICKER" value={p.symbol || ""} onChange={(e) => upd(i, "symbol", e.target.value.toUpperCase())} />
                <input style={ip} type="number" min="0" max="100" placeholder="Score" value={p.score} onChange={(e) => upd(i, "score", +e.target.value)} />
                <select style={ip} value={p.sentiment} onChange={(e) => upd(i, "sentiment", e.target.value)}><option>Bullish</option><option>Neutral</option><option>Bearish</option></select>
                <select style={ip} value={p.conviction} onChange={(e) => upd(i, "conviction", e.target.value)}><option>High</option><option>Medium</option><option>Low</option></select>
                <button onClick={() => remove(i)} title="Remove" style={{ border: 0, background: "none", color: "var(--red)", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <label style={{ fontSize: 10, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 3 }}>Narrative (0–100)<input style={ip} type="number" min="0" max="100" value={p.narrative} onChange={(e) => upd(i, "narrative", +e.target.value)} /></label>
                <label style={{ fontSize: 10, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 3 }}>Sentiment score (0–100)<input style={ip} type="number" min="0" max="100" value={p.sentimentScore} onChange={(e) => upd(i, "sentimentScore", +e.target.value)} /></label>
              </div>
              <input style={ip} placeholder="Tags (comma-separated)" value={(p.tags || []).join(", ")} onChange={(e) => upd(i, "tags", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
              <textarea style={{ ...ip, height: 58, padding: "6px 8px", resize: "vertical", fontFamily: "inherit", lineHeight: 1.4 }} placeholder="Thesis…" value={p.thesis || ""} onChange={(e) => upd(i, "thesis", e.target.value)} />
            </div>
          ))}
          <button className="run-btn run-dirty" style={{ height: 34, borderRadius: 8 }} onClick={add}>+ Add pick</button>
          <div style={{ fontSize: 11, color: "var(--faint)" }}>Saved automatically · visible to all members.</div>
        </div>
      ) : (
        <div className="picks">
          {list.length === 0 && <div style={{ fontSize: 12, color: "var(--faint)", padding: "8px 2px" }}>No picks published yet.</div>}
          {list.map((p, i) => (<PickCard key={p.symbol + i} pick={p} rank={i + 1} featured={i === 0} onSelect={onSelect} />))}
        </div>
      )}
    </MCard>
  );
}

// ── Saved screens (links into Screener) ──────────────────────────────────────
function PresetsCard() {
  return (
    <MCard title="Saved screens" sub={window.PRESETS.length + " presets"}
      action={<a className="card-action" href="/screener">Open screener →</a>}>
      <div className="preset-list">
        {window.PRESETS.map((p) => (
          <a className="preset-row" href="/screener" key={p.name}>
            <span className="preset-bar" style={{ background: p.accent }} />
            <span className="preset-id">
              <span className="preset-name">{p.name}</span>
              <span className="preset-desc">{p.desc}</span>
            </span>
            <span className="preset-count num">{p.count}</span>
            <span className="preset-arrow">→</span>
          </a>
        ))}
      </div>
    </MCard>
  );
}

// ── Portfolio summary (per-account, editable) ────────────────────────────────
// Receives the signed-in user's portfolio + an onChange to persist it (the app
// debounces saves to /api/me). Holdings can be added/removed; cash is editable.
// Prices/day-change are live via look() over the loaded universe.
function PortfolioCard({ portfolio, onChange }) {
  const p = portfolio && portfolio.holdings ? portfolio : { cash: 0, holdings: [] };
  const [editing, setEditing] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [shares, setShares] = React.useState("");
  const [cost, setCost] = React.useState("");

  const rows = p.holdings.map((h) => {
    const s = mLook(h.symbol);
    const value = h.shares * s.price;
    const dayChg = value * (s.changePct / 100);
    const pl = (s.price - h.avgCost) * h.shares;
    return { ...h, s, value, dayChg, pl };
  });
  const holdingsVal = rows.reduce((a, r) => a + r.value, 0);
  const total = holdingsVal + (p.cash || 0);
  const dayChg = rows.reduce((a, r) => a + r.dayChg, 0);
  const dayBase = holdingsVal - dayChg;
  const dayPct = dayBase ? (dayChg / dayBase) * 100 : 0;
  const totalPL = rows.reduce((a, r) => a + r.pl, 0);
  const costBasis = rows.reduce((a, r) => a + r.avgCost * r.shares, 0);
  const plPct = costBasis ? (totalPL / costBasis) * 100 : 0;
  const movers = [...rows].sort((a, b) => Math.abs(b.dayChg) - Math.abs(a.dayChg)).slice(0, 3);
  const up = dayChg >= 0;

  const matches = q.trim()
    ? window.STOCKS.filter((s) => !p.holdings.some((h) => h.symbol === s.symbol) &&
        (s.symbol.toLowerCase().includes(q.toLowerCase()) || (s.companyName || "").toLowerCase().includes(q.toLowerCase()))).slice(0, 5)
    : [];
  const addHolding = (sym) => {
    const sh = +shares || 0, ac = +cost || 0;
    if (!sym || sh <= 0) return;
    onChange({ ...p, holdings: [{ symbol: sym, shares: sh, avgCost: ac }, ...p.holdings] });
    setQ(""); setShares(""); setCost("");
  };
  const removeHolding = (sym) => onChange({ ...p, holdings: p.holdings.filter((h) => h.symbol !== sym) });
  const setCash = (v) => onChange({ ...p, cash: Math.max(0, +v || 0) });

  const ipStyle = { height: 28, border: "1px solid var(--border2)", borderRadius: 6, padding: "0 8px", font: "inherit", fontSize: 12, outline: "none", minWidth: 0 };

  return (
    <MCard title="Portfolio" sub={rows.length + " holding" + (rows.length === 1 ? "" : "s")}
      action={<button className="card-action" onClick={() => setEditing((e) => !e)}>{editing ? "Done" : "Edit"}</button>}>
      <div className="pf-value">
        <span className="pf-total num">{mMoney(total)}</span>
        <span className={"pf-day num " + (up ? "chg-pos" : "chg-neg")}>{up ? "▲" : "▼"} {mMoney(Math.abs(dayChg))} ({mSigned(dayPct)}%)</span>
        <span className="pf-day-label">today</span>
      </div>
      <div className="pf-meta">
        <div className="pf-stat">
          <span className="pf-k">Total P/L</span>
          <span className={"pf-v num " + (totalPL >= 0 ? "chg-pos" : "chg-neg")}>{totalPL >= 0 ? "+" : "−"}{mMoney(Math.abs(totalPL))} ({mSigned(plPct)}%)</span>
        </div>
        <div className="pf-stat">
          <span className="pf-k">Cash</span>
          {editing
            ? <input className="num" style={{ ...ipStyle, width: 110 }} type="number" min="0" value={p.cash} onChange={(e) => setCash(e.target.value)} />
            : <span className="pf-v num">{mMoney(p.cash || 0)}</span>}
        </div>
      </div>

      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          {rows.map((r) => (
            <div key={r.symbol} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderTop: "1px solid var(--border)" }}>
              <span className="num" style={{ fontWeight: 700, color: "var(--accent)", width: 56 }}>{r.symbol}</span>
              <span className="num td-muted" style={{ fontSize: 11 }}>{r.shares} sh @ ${mFmtPrice(r.avgCost)}</span>
              <span className="num" style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600 }}>{mMoney(r.value)}</span>
              <button title="Remove" onClick={() => removeHolding(r.symbol)}
                style={{ border: 0, background: "none", color: "var(--red)", fontSize: 17, lineHeight: 1, cursor: "pointer", width: 18 }}>×</button>
            </div>
          ))}
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 64px 74px", gap: 6, marginTop: 4 }}>
            <input style={ipStyle} placeholder="Add ticker…" value={q} onChange={(e) => setQ(e.target.value)} />
            <input style={ipStyle} type="number" min="0" placeholder="Shares" value={shares} onChange={(e) => setShares(e.target.value)} />
            <input style={ipStyle} type="number" min="0" placeholder="Avg $" value={cost} onChange={(e) => setCost(e.target.value)} />
            {matches.length > 0 && (
              <div className="wl-menu" style={{ top: 32 }}>
                {matches.map((s) => (
                  <button key={s.symbol} className="wl-opt" onClick={() => { setQ(s.symbol); }}>
                    <span className="wl-opt-sym">{s.symbol}</span>
                    <span className="wl-opt-name">{s.companyName}</span>
                    <span className="wl-opt-plus">＋</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="run-btn run-dirty" style={{ height: 32 }}
            onClick={() => addHolding(cleanAddSym(q))}>Add holding</button>
        </div>
      ) : (
        <div className="pf-movers">
          <span className="pf-movers-label">Top movers</span>
          {movers.length === 0 && <span className="td-muted" style={{ fontSize: 11.5 }}>No holdings yet — tap Edit to add.</span>}
          {movers.map((m) => {
            const mu = m.dayChg >= 0;
            return (
              <div className="pf-mover" key={m.symbol}>
                <span className="pf-mover-sym">{m.symbol}</span>
                <span className={"num pf-mover-chg " + (mu ? "chg-pos" : "chg-neg")}>{mSigned(m.s.changePct)}%</span>
              </div>
            );
          })}
        </div>
      )}
    </MCard>
  );
}
// Resolve a typed ticker to a real universe symbol (exact match wins, else first prefix).
function cleanAddSym(q) {
  const Q = String(q || "").trim().toUpperCase();
  if (!Q) return "";
  if (window.STOCK_BY_SYM && window.STOCK_BY_SYM[Q]) return Q;
  const m = (window.STOCKS || []).find((s) => s.symbol.toUpperCase().startsWith(Q));
  return m ? m.symbol : Q;
}

// ── Positions book (owner-editable; click a row to pop the full write-up) ─────
const POS_DIR = ["Long", "Short"];
const POS_STATUS = ["Open", "Watching", "Closed"];

function posReturn(p, s) {
  if (!(p.entry > 0) || !s || !(s.price > 0)) return null;
  return ((p.direction === "Short" ? p.entry - s.price : s.price - p.entry) / p.entry) * 100;
}

function PositionReport({ position: p, onClose }) {
  const s = mLook(p.symbol);
  const ret = posReturn(p, s);
  const up = (ret || 0) >= 0;
  React.useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  const Row = ({ k, v, cls }) => <div className="pk-row"><span>{k}</span><span className={"num " + (cls || "")}>{v}</span></div>;
  return (
    <div className="peek-overlay" onClick={onClose}>
      <div className="peek" onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: "94vw" }}>
        <div className="peek-head">
          <div>
            <div className="peek-sym">{p.symbol}
              <span className={"pos-dir " + (p.direction === "Short" ? "pos-short" : "pos-long")}>{p.direction}</span>
              <span className={"pos-status pos-st-" + (p.status || "Open").toLowerCase()}>{p.status}</span>
            </div>
            <div className="peek-name">{s.companyName}</div>
          </div>
          <button className="peek-x" onClick={onClose}>×</button>
        </div>
        <div className="peek-grid">
          <Row k="Entry" v={"$" + mFmtPrice(p.entry)} />
          <Row k="Current" v={"$" + mFmtPrice(s.price)} />
          <Row k="Return" v={ret == null ? "—" : (up ? "+" : "") + ret.toFixed(1) + "%"} cls={up ? "chg-pos" : "chg-neg"} />
          <Row k="Target" v={p.target ? "$" + mFmtPrice(p.target) : "—"} />
          <Row k="Sizing" v={p.sizing || "—"} />
          <Row k="Opened" v={p.date || "—"} />
        </div>
        <div className="pos-report">{p.report || "No write-up yet."}</div>
        <div className="peek-actions">
          <a className="peek-open" style={{ flex: 1, justifyContent: "center" }}
            href={"/stock-details?ticker=" + encodeURIComponent(p.symbol)} target="_blank" rel="noopener">Open full research →</a>
        </div>
      </div>
    </div>
  );
}

function PositionsCard({ positions, isOwner, onChange }) {
  const [editing, setEditing] = React.useState(false);
  const [open, setOpen] = React.useState(null);   // position whose report is shown
  const list = Array.isArray(positions) ? positions : [];
  const ip = { height: 28, border: "1px solid var(--border2)", borderRadius: 6, padding: "0 8px", font: "inherit", fontSize: 12, outline: "none", minWidth: 0, width: "100%", background: "var(--panel)", color: "var(--fg)" };
  const upd = (i, k, v) => { const n = list.slice(); n[i] = { ...n[i], [k]: v }; onChange(n); };
  const remove = (i) => { const n = list.slice(); n.splice(i, 1); onChange(n); };
  const add = () => onChange([...list, { symbol: "", direction: "Long", entry: 0, target: null, date: "", status: "Open", sizing: "", report: "" }]);

  return (
    <MCard title="Positions" sub="The desk's live book · tap a name for the full write-up"
      action={isOwner
        ? <button className="card-action" onClick={() => setEditing((e) => !e)}>{editing ? "Done" : "Edit"}</button>
        : <span className="card-stamp">Updated today</span>}
      className="card-positions">
      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {list.map((p, i) => (
            <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "12px 13px", display: "flex", flexDirection: "column", gap: 8, background: "var(--strip)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 26px", gap: 8, alignItems: "center" }}>
                <input style={ip} placeholder="TICKER" value={p.symbol || ""} onChange={(e) => upd(i, "symbol", e.target.value.toUpperCase())} />
                <select style={ip} value={p.direction} onChange={(e) => upd(i, "direction", e.target.value)}>{POS_DIR.map((d) => <option key={d}>{d}</option>)}</select>
                <select style={ip} value={p.status} onChange={(e) => upd(i, "status", e.target.value)}>{POS_STATUS.map((d) => <option key={d}>{d}</option>)}</select>
                <button onClick={() => remove(i)} title="Remove" style={{ border: 0, background: "none", color: "var(--red)", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <label style={{ fontSize: 10, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 3 }}>Entry $<input style={ip} type="number" min="0" step="0.01" value={p.entry} onChange={(e) => upd(i, "entry", +e.target.value)} /></label>
                <label style={{ fontSize: 10, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 3 }}>Target $<input style={ip} type="number" min="0" step="0.01" value={p.target == null ? "" : p.target} onChange={(e) => upd(i, "target", e.target.value === "" ? null : +e.target.value)} /></label>
                <label style={{ fontSize: 10, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 3 }}>Opened<input style={ip} type="date" value={p.date || ""} onChange={(e) => upd(i, "date", e.target.value)} /></label>
              </div>
              <input style={ip} placeholder="Sizing (e.g. 5% of book)" value={p.sizing || ""} onChange={(e) => upd(i, "sizing", e.target.value)} />
              <textarea style={{ ...ip, height: 84, padding: "6px 8px", resize: "vertical", fontFamily: "inherit", lineHeight: 1.45 }} placeholder="Report / thesis — shown when a member opens this position…" value={p.report || ""} onChange={(e) => upd(i, "report", e.target.value)} />
            </div>
          ))}
          <button className="run-btn run-dirty" style={{ height: 34, borderRadius: 8 }} onClick={add}>+ Add position</button>
          <div style={{ fontSize: 11, color: "var(--faint)" }}>Saved automatically · visible to all members.</div>
        </div>
      ) : (
        <div className="positions">
          {list.length === 0 && <div style={{ fontSize: 12, color: "var(--faint)", padding: "8px 2px" }}>No positions published yet.</div>}
          {list.map((p, i) => {
            const s = mLook(p.symbol);
            const ret = posReturn(p, s);
            const up = (ret || 0) >= 0;
            return (
              <button className="pos-row" key={p.symbol + i} onClick={() => setOpen(p)} title={`Open ${p.symbol} write-up`}>
                <span className="pos-sym">{p.symbol}</span>
                <span className={"pos-dir " + (p.direction === "Short" ? "pos-short" : "pos-long")}>{p.direction}</span>
                <span className="pos-entry num">@ ${mFmtPrice(p.entry)}</span>
                <span className={"pos-ret num " + (up ? "chg-pos" : "chg-neg")}>{ret == null ? "—" : (up ? "+" : "") + ret.toFixed(1) + "%"}</span>
                <span className={"pos-status-chip pos-st-" + (p.status || "Open").toLowerCase()}>{p.status}</span>
                <span className="pos-arrow">→</span>
              </button>
            );
          })}
        </div>
      )}
      {open && <PositionReport position={open} onClose={() => setOpen(null)} />}
    </MCard>
  );
}

window.MemberFeatures = { PicksFeed, PresetsCard, PortfolioCard, PositionsCard };
