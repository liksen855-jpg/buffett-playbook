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
    <article className={"pick" + (featured ? " pick-featured" : "")} onClick={() => onSelect(s)}>
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

function PicksFeed({ onSelect }) {
  return (
    <MCard title="Quality Picks" sub="Scored on narrative · sentiment · conviction"
      action={<span className="card-stamp">Updated today · 09:30 ET</span>} className="card-picks">
      <div className="picks">
        {window.PICKS.map((p, i) => (
          <PickCard key={p.symbol} pick={p} rank={i + 1} featured={i === 0} onSelect={onSelect} />
        ))}
      </div>
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

// ── Portfolio summary (links out) ────────────────────────────────────────────
function PortfolioCard() {
  const p = window.PORTFOLIO;
  const rows = p.holdings.map((h) => {
    const s = mLook(h.symbol);
    const value = h.shares * s.price;
    const dayChg = value * (s.changePct / 100);
    const pl = (s.price - h.avgCost) * h.shares;
    return { ...h, s, value, dayChg, pl };
  });
  const holdingsVal = rows.reduce((a, r) => a + r.value, 0);
  const total = holdingsVal + p.cash;
  const dayChg = rows.reduce((a, r) => a + r.dayChg, 0);
  const dayPct = (dayChg / (holdingsVal - dayChg)) * 100;
  const totalPL = rows.reduce((a, r) => a + r.pl, 0);
  const costBasis = rows.reduce((a, r) => a + r.avgCost * r.shares, 0);
  const plPct = (totalPL / costBasis) * 100;
  const movers = [...rows].sort((a, b) => Math.abs(b.dayChg) - Math.abs(a.dayChg)).slice(0, 3);
  const up = dayChg >= 0;

  return (
    <MCard title="Portfolio" sub={rows.length + " holdings"}
      action={<a className="card-action" href="#" onClick={(e) => e.preventDefault()}>Full view →</a>}>
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
          <span className="pf-v num">{mMoney(p.cash)}</span>
        </div>
      </div>
      <div className="pf-movers">
        <span className="pf-movers-label">Top movers</span>
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
    </MCard>
  );
}

window.MemberFeatures = { PicksFeed, PresetsCard, PortfolioCard };
