// ── Members dashboard components ─────────────────────────────────────────────
const { useState, useMemo, useEffect, useRef } = React;
const { fmtPrice, fmtCap, fmtVol, Sparkline } = window.ScreenerParts;

// Read the live map each call — it's populated asynchronously by data/live.js
// after the gate passes, so a load-time snapshot would be permanently empty.
const look = (sym) => (window.STOCK_BY_SYM && window.STOCK_BY_SYM[sym]) || { symbol: sym, companyName: sym, price: 0, changePct: 0, sector: "—" };
const signed = (n, d = 2) => (n >= 0 ? "+" : "") + n.toFixed(d);
const fmtMoney = (n) => "$" + Math.round(n).toLocaleString("en-US");

// ── Market pulse bar ─────────────────────────────────────────────────────────
function PulseBar() {
  const fmtPulse = (p) => {
    if (p.kind === "crypto") return "$" + Math.round(p.value).toLocaleString();
    if (p.unit === "%") return p.value.toFixed(2) + "%";
    if (p.unit === "$") return "$" + p.value.toFixed(2);
    return p.value.toLocaleString("en-US", { minimumFractionDigits: p.value < 100 ? 2 : 1, maximumFractionDigits: 2 });
  };
  const b = window.BREADTH;
  const total = b.advancers + b.decliners + b.unchanged;
  return (
    <div className="pulse">
      <div className="pulse-scroll">
        {window.PULSE.map((p) => {
          const up = p.invert ? p.changePct <= 0 : p.changePct >= 0;
          return (
            <div className="pulse-tile" key={p.sym}>
              <div className="pt-label">{p.label}</div>
              <div className="pt-value num">{fmtPulse(p)}</div>
              <div className={"pt-chg num " + (up ? "chg-pos" : "chg-neg")}>{signed(p.changePct)}%</div>
            </div>
          );
        })}
      </div>
      <div className="pulse-breadth">
        <div className="pb-label">Breadth</div>
        <div className="pb-bar" title={b.advancers + " up · " + b.decliners + " down"}>
          <span className="pb-up"  style={{ width: (b.advancers / total * 100) + "%" }} />
          <span className="pb-flat" style={{ width: (b.unchanged / total * 100) + "%" }} />
          <span className="pb-down" style={{ width: (b.decliners / total * 100) + "%" }} />
        </div>
        <div className="pb-nums num"><span className="chg-pos">{b.advancers}</span> / <span className="chg-neg">{b.decliners}</span></div>
      </div>
    </div>
  );
}

// ── Section shell ────────────────────────────────────────────────────────────
function Card({ title, sub, action, children, className }) {
  return (
    <section className={"card " + (className || "")}>
      <div className="card-head">
        <div className="card-titles">
          <h2 className="card-title">{title}</h2>
          {sub && <span className="card-sub">{sub}</span>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// ── Watchlist (right rail, retention hook) ───────────────────────────────────
function Watchlist({ list, onAdd, onRemove, onSelect }) {
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { if (adding && inputRef.current) inputRef.current.focus(); }, [adding]);

  const avail = window.STOCKS.filter((s) => !list.includes(s.symbol));
  const matches = q.trim()
    ? avail.filter((s) => s.symbol.toLowerCase().includes(q.toLowerCase()) || s.companyName.toLowerCase().includes(q.toLowerCase())).slice(0, 6)
    : [];
  const commit = (sym) => { onAdd(sym); setQ(""); setAdding(false); };

  return (
    <Card title="Watchlist" sub={list.length + " tickers"}
      action={<button className="card-action" onClick={() => setAdding((a) => !a)}>{adding ? "Done" : "+ Add"}</button>}>
      {adding && (
        <div className="wl-add">
          <input ref={inputRef} className="wl-input" value={q} placeholder="Search ticker or company…"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && matches[0]) commit(matches[0].symbol); if (e.key === "Escape") setAdding(false); }} />
          {matches.length > 0 && (
            <div className="wl-menu">
              {matches.map((s) => (
                <button key={s.symbol} className="wl-opt" onClick={() => commit(s.symbol)}>
                  <span className="wl-opt-sym">{s.symbol}</span>
                  <span className="wl-opt-name">{s.companyName}</span>
                  <span className="wl-opt-plus">+</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="wl-list">
        {list.length === 0 && <div className="wl-empty">Your watchlist is empty. Add a ticker to drive your news &amp; earnings.</div>}
        {list.map((sym) => {
          const s = look(sym);
          const up = s.changePct >= 0;
          return (
            <div className="wl-row" key={sym} onClick={() => onSelect(s)}>
              <div className="wl-id">
                <span className="wl-sym">{s.symbol}</span>
                <span className="wl-name">{s.companyName}</span>
              </div>
              <Sparkline symbol={s.symbol} changePct={s.changePct} w={50} h={20} />
              <div className="wl-px">
                <span className="num wl-price">{fmtPrice(s.price)}</span>
                <span className={"num wl-chg " + (up ? "chg-pos" : "chg-neg")}>{signed(s.changePct)}%</span>
              </div>
              <button className="wl-x" title="Remove" onClick={(e) => { e.stopPropagation(); onRemove(sym); }}>×</button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── High-impact news ─────────────────────────────────────────────────────────
const SENT = { pos: { c: "chg-pos", g: "▲" }, neg: { c: "chg-neg", g: "▼" }, neu: { c: "td-muted", g: "■" } };
function NewsFeed({ list, scope, setScope, onSelect }) {
  const items = useMemo(() => {
    let rows = window.NEWS.filter((n) => n.impact !== "low");
    if (scope === "watchlist") rows = rows.filter((n) => list.includes(n.symbol));
    return rows.slice(0, 9);
  }, [scope, list]);

  return (
    <Card title="High-impact news" sub={scope === "watchlist" ? "Your watchlist" : "Market-wide"}
      action={
        <div className="seg seg-sm">
          <button className={scope === "watchlist" ? "seg-on" : ""} onClick={() => setScope("watchlist")}>Watchlist</button>
          <button className={scope === "all" ? "seg-on" : ""} onClick={() => setScope("all")}>All</button>
        </div>
      }>
      <div className="news-list">
        {items.length === 0 && <div className="news-empty">No high-impact headlines on your watchlist right now. Switch to “All”.</div>}
        {items.map((n) => {
          const s = look(n.symbol);
          const st = SENT[n.sentiment];
          return (
            <button className="news-row" key={n.id} onClick={() => onSelect(s)}>
              <span className={"news-impact impact-" + n.impact} title={n.impact + " impact"} />
              <span className="news-ticker">{n.symbol}</span>
              <span className="news-headline">{n.headline}</span>
              <span className="news-meta">
                <span className={"news-sent " + st.c}>{st.g}</span>
                <span className="news-src">{n.source}</span>
                <span className="news-time">{n.time}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ── Earnings ahead ───────────────────────────────────────────────────────────
function EarningsList({ list }) {
  const items = useMemo(() => window.EARNINGS.filter((e) => list.includes(e.symbol)).slice(0, 6), [list]);
  return (
    <Card title="Earnings ahead" sub={items.length ? "Next " + items.length : "Watchlist"}>
      <div className="ern-list">
        {items.length === 0 && <div className="news-empty">No upcoming earnings for your watchlist.</div>}
        {items.map((e) => {
          const s = look(e.symbol);
          return (
            <div className="ern-row" key={e.symbol}>
              <div className="ern-date">
                <span className="ern-dow">{e.dow}</span>
                <span className="ern-day num">{e.date.split(" ")[1]}</span>
              </div>
              <div className="ern-id">
                <span className="ern-sym">{e.symbol}</span>
                <span className="ern-name">{s.companyName}</span>
              </div>
              <div className="ern-meta">
                <span className={"ern-when when-" + e.when.toLowerCase()}>{e.when}</span>
                <span className="ern-eps num">est {e.epsEst.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

window.MemberParts = { PulseBar, Card, Watchlist, NewsFeed, EarningsList, look, signed, fmtMoney };
