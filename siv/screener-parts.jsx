// ── Screener app ───────────────────────────────────────────────────────────
// Refined, working stock screener over mock data (window.STOCKS).
// Reactive filtering + sorting; layout/view/density/accent driven by Tweaks.

const { useState, useMemo, useEffect, useRef } = React;

// ── Formatting ───────────────────────────────────────────────────────────────
const fmtPrice = (n) => n == null ? "—" : n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCap = (n) => {
  if (n == null) return "—";
  if (n >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9)  return "$" + (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6)  return "$" + (n / 1e6).toFixed(0) + "M";
  return "$" + n.toLocaleString();
};
const fmtVol = (n) => {
  if (n == null) return "—";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
};
const yieldOf = (s) => s.price ? (s.lastAnnualDividend / s.price) * 100 : 0;

const CAP_TIERS = [
  { id: "mega",  label: "Mega",  lo: 200e9, hi: Infinity },
  { id: "large", label: "Large", lo: 10e9,  hi: 200e9 },
  { id: "mid",   label: "Mid",   lo: 2e9,   hi: 10e9 },
  { id: "small", label: "Small", lo: 300e6, hi: 2e9 },
  { id: "micro", label: "Micro", lo: 0,     hi: 300e6 },
];
const capTier = (cap) => CAP_TIERS.find((t) => cap >= t.lo && cap < t.hi);

const SECTORS = ["Technology","Healthcare","Financials","Consumer Cyclical","Consumer Defensive","Industrials","Energy","Utilities","Real Estate","Basic Materials","Communication Services"];

// ── Deterministic sparkline points from a symbol ─────────────────────────────
function sparkPoints(symbol, changePct, n = 24) {
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) seed = (seed * 31 + symbol.charCodeAt(i)) % 100000;
  const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const drift = (changePct || 0) / 100 / n;
  let v = 0.5; const pts = [];
  for (let i = 0; i < n; i++) { v += (rand() - 0.5) * 0.12 + drift; pts.push(v); }
  const min = Math.min(...pts), max = Math.max(...pts), span = (max - min) || 1;
  return pts.map((p) => (p - min) / span);
}

function Sparkline({ symbol, changePct, w = 64, h = 22 }) {
  const norm = useMemo(() => sparkPoints(symbol, changePct), [symbol, changePct]);
  const pad = 2;
  const pathD = norm.map((p, i) => {
    const x = pad + (i / (norm.length - 1)) * (w - pad * 2);
    const y = pad + (1 - p) * (h - pad * 2);
    return (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1);
  }).join(" ");
  const up = (changePct || 0) >= 0;
  const stroke = up ? "var(--green)" : "var(--red)";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }} aria-hidden="true">
      <path d={pathD} fill="none" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

function CapBadge({ cap }) {
  const t = capTier(cap);
  if (!t) return null;
  return <span className={"cap-badge cap-" + t.id}>{t.label}</span>;
}

// ── Filter primitives ────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div className="field">
      <label className="field-label">{label}{hint && <span className="field-hint">{hint}</span>}</label>
      {children}
    </div>
  );
}

function RangeField({ label, unit, vMin, vMax, onMin, onMax, step = "any", placeholderMax = "Any" }) {
  return (
    <Field label={label}>
      <div className="range-row">
        <input className="inp" type="number" inputMode="decimal" min="0" step={step} value={vMin} placeholder="Min" onChange={(e) => onMin(e.target.value)} />
        <span className="range-dash">–</span>
        <input className="inp" type="number" inputMode="decimal" min="0" step={step} value={vMax} placeholder={placeholderMax} onChange={(e) => onMax(e.target.value)} />
        {unit && <span className="range-unit">{unit}</span>}
      </div>
    </Field>
  );
}

function CapChips({ value, onChange }) {
  return (
    <Field label="Market cap">
      <div className="chips">
        <button className={"chip" + (value === "" ? " chip-on" : "")} onClick={() => onChange("")}>Any</button>
        {CAP_TIERS.map((t) => (
          <button key={t.id} className={"chip chip-" + t.id + (value === t.id ? " chip-on" : "")} onClick={() => onChange(value === t.id ? "" : t.id)}>{t.label}</button>
        ))}
      </div>
    </Field>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <button className={"toggle" + (checked ? " toggle-on" : "")} onClick={() => onChange(!checked)} role="switch" aria-checked={checked}>
      <span className="toggle-track"><span className="toggle-thumb" /></span>
      <span className="toggle-label">{label}</span>
    </button>
  );
}

// ── Filter form (shared by rail + top layouts) ───────────────────────────────
function FilterFields({ f, set, layout }) {
  return (
    <div className={"filter-fields " + (layout === "top" ? "ff-grid" : "ff-stack")}>
      <Field label="Sector">
        <select className="inp" value={f.sector} onChange={(e) => set("sector", e.target.value)}>
          <option value="">All sectors</option>
          {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Industry">
        <input className="inp" type="text" value={f.industry} placeholder="e.g. Semiconductors" onChange={(e) => set("industry", e.target.value)} />
      </Field>
      <CapChips value={f.mktcap} onChange={(v) => set("mktcap", v)} />
      <RangeField label="Price" unit="$" vMin={f.priceMin} vMax={f.priceMax} onMin={(v) => set("priceMin", v)} onMax={(v) => set("priceMax", v)} />
      <Field label="Min volume">
        <input className="inp" type="number" min="0" value={f.volMin} placeholder="0" onChange={(e) => set("volMin", e.target.value)} />
      </Field>
      <RangeField label="Beta" vMin={f.betaMin} vMax={f.betaMax} onMin={(v) => set("betaMin", v)} onMax={(v) => set("betaMax", v)} step="0.1" />
      <Field label="Min dividend yield" hint="%">
        <input className="inp" type="number" min="0" step="0.1" value={f.divMin} placeholder="0" onChange={(e) => set("divMin", e.target.value)} />
      </Field>
      <div className="toggles">
        <Toggle label="Exclude ETFs" checked={f.excludeEtf} onChange={(v) => set("excludeEtf", v)} />
        <Toggle label="Dividend payers only" checked={f.divOnly} onChange={(v) => set("divOnly", v)} />
      </div>
    </div>
  );
}

// ── Active filter badges ─────────────────────────────────────────────────────
function ActiveBadges({ f, clear, clearAll }) {
  const pills = [];
  const P = (key, label) => pills.push({ key, label });
  if (f.sector)   P("sector", "Sector · " + f.sector);
  if (f.industry) P("industry", "Industry · " + f.industry);
  if (f.mktcap)   P("mktcap", "Cap · " + (capTier ? f.mktcap[0].toUpperCase() + f.mktcap.slice(1) : f.mktcap));
  if (f.priceMin) P("priceMin", "Price ≥ $" + f.priceMin);
  if (f.priceMax) P("priceMax", "Price ≤ $" + f.priceMax);
  if (f.volMin)   P("volMin", "Vol ≥ " + Number(f.volMin).toLocaleString());
  if (f.betaMin)  P("betaMin", "Beta ≥ " + f.betaMin);
  if (f.betaMax)  P("betaMax", "Beta ≤ " + f.betaMax);
  if (f.divMin)   P("divMin", "Yield ≥ " + f.divMin + "%");
  if (f.excludeEtf) P("excludeEtf", "No ETFs");
  if (f.divOnly)  P("divOnly", "Dividend payers");
  if (!pills.length) return <div className="badges badges-empty">No filters applied — showing the full universe.</div>;
  return (
    <div className="badges">
      {pills.map((p) => (
        <span key={p.key} className="badge">{p.label}<button className="badge-x" onClick={() => clear(p.key)} aria-label={"Clear " + p.label}>×</button></span>
      ))}
      <button className="badge-clear" onClick={clearAll}>Clear all</button>
    </div>
  );
}

// ── Results: table ───────────────────────────────────────────────────────────
const COLUMNS = [
  { key: "symbol",     label: "Ticker",  align: "left" },
  { key: "spark",      label: "30D",     align: "left", noSort: true },
  { key: "price",      label: "Price",   align: "right" },
  { key: "changePct",  label: "Chg",     align: "right" },
  { key: "marketCap",  label: "Mkt cap", align: "right" },
  { key: "volume",     label: "Volume",  align: "right" },
  { key: "beta",       label: "Beta",    align: "right" },
  { key: "yield",      label: "Yield",   align: "right" },
];

function ResultsTable({ rows, sort, onSort, onSelect }) {
  return (
    <div className="table-wrap">
      <table className="scr-table">
        <thead>
          <tr>
            <th className="th-co">Company</th>
            {COLUMNS.map((c) => {
              const on = sort.col === c.key;
              const cls = (c.key === "symbol" ? "th-symcol " : "") + (c.align === "right" ? "th-r " : "") + (c.noSort ? "th-nosort " : "") + (on ? "th-sort sort-" + sort.dir : "");
              return <th key={c.key} className={cls.trim()} onClick={() => !c.noSort && onSort(c.key)}>{c.label}</th>;
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const up = s.changePct >= 0;
            return (
              <tr key={s.symbol} onClick={() => onSelect(s)}>
                <td className="td-co">
                  <span className="co-sym">{s.symbol}{s.isEtf && <span className="etf-tag">ETF</span>}</span>
                  <span className="co-name">{s.companyName}</span>
                  <span className="co-sector">{s.sector === "—" ? "ETF" : s.sector}</span>
                </td>
                <td className="td-sym"><span className="ticker">{s.symbol}</span></td>
                <td className="td-spark"><Sparkline symbol={s.symbol} changePct={s.changePct} /></td>
                <td className="num td-r">{fmtPrice(s.price)}</td>
                <td className={"num td-r " + (up ? "chg-pos" : "chg-neg")}>{up ? "+" : ""}{s.changePct.toFixed(2)}%</td>
                <td className="td-r"><span className="num">{fmtCap(s.marketCap)}</span><CapBadge cap={s.marketCap} /></td>
                <td className="num td-r td-muted">{fmtVol(s.volume)}</td>
                <td className="num td-r">{s.beta != null ? s.beta.toFixed(2) : "—"}</td>
                <td className="num td-r td-muted">{yieldOf(s) ? yieldOf(s).toFixed(2) + "%" : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Results: cards ───────────────────────────────────────────────────────────
function ResultsCards({ rows, onSelect }) {
  return (
    <div className="cards">
      {rows.map((s) => {
        const up = s.changePct >= 0;
        return (
          <button key={s.symbol} className="scard" onClick={() => onSelect(s)}>
            <div className="scard-top">
              <div>
                <div className="scard-sym">{s.symbol}{s.isEtf && <span className="etf-tag">ETF</span>}</div>
                <div className="scard-name">{s.companyName}</div>
              </div>
              <CapBadge cap={s.marketCap} />
            </div>
            <div className="scard-spark"><Sparkline symbol={s.symbol} changePct={s.changePct} w={220} h={40} /></div>
            <div className="scard-price-row">
              <span className="scard-price num">${fmtPrice(s.price)}</span>
              <span className={"num " + (up ? "chg-pos" : "chg-neg")}>{up ? "+" : ""}{s.changePct.toFixed(2)}%</span>
            </div>
            <div className="scard-stats">
              <div><span className="k">Mkt cap</span><span className="v num">{fmtCap(s.marketCap)}</span></div>
              <div><span className="k">Volume</span><span className="v num">{fmtVol(s.volume)}</span></div>
              <div><span className="k">Beta</span><span className="v num">{s.beta?.toFixed(2) ?? "—"}</span></div>
              <div><span className="k">Yield</span><span className="v num">{yieldOf(s) ? yieldOf(s).toFixed(2) + "%" : "—"}</span></div>
            </div>
            <div className="scard-sector">{s.sector === "—" ? "Exchange-traded fund" : s.sector + " · " + s.industry}</div>
          </button>
        );
      })}
    </div>
  );
}

window.ScreenerParts = { fmtPrice, fmtCap, fmtVol, yieldOf, capTier, CAP_TIERS, SECTORS, Sparkline, CapBadge, Field, RangeField, CapChips, Toggle, FilterFields, ActiveBadges, ResultsTable, ResultsCards, COLUMNS };
