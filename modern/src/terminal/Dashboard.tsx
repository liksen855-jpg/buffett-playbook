import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Stock, DashboardData, Pick, Portfolio } from '../types/terminal';
import { PulseBar } from './PulseBar';
import { WatchlistPanel } from './WatchlistPanel';
import { NewsPanel } from './NewsPanel';
import { PicksPanel } from './PicksPanel';
import { PortfolioPanel } from './PortfolioPanel';

const DEFAULT_DATA: DashboardData = {
  stocks: [],
  stockBySym: {},
  pulse: [],
  news: [],
  earnings: [],
  breadth: { advancers: 0, decliners: 0, unchanged: 0 },
  picks: [],
  presets: [
    { id: 'quality', label: 'Quality Growth', query: 'marketCap>10B&pe<30&debtToEquity<0.5&roe>15' },
    { id: 'value', label: 'Deep Value', query: 'pe<15&pb<2&debtToEquity<1' },
    { id: 'dividend', label: 'Dividend Aristocrats', query: 'dividendYield>2&payoutRatio<0.6&marketCap>5B' },
    { id: 'momentum', label: 'Momentum', query: 'changesPercentage>5&volume>1000000' },
  ],
  portfolio: { cash: 0, holdings: [] },
  defaultWatchlist: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'],
};

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData>(DEFAULT_DATA);
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_DATA.defaultWatchlist);
  const [portfolio, setPortfolio] = useState<Portfolio>(DEFAULT_DATA.portfolio);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [selected, setSelected] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const picksTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load dashboard data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [meRes, picksRes] = await Promise.allSettled([
          fetch('/api/me').then(r => r.ok ? r.json() : null),
          fetch('/api/picks').then(r => r.ok ? r.json() : null),
        ]);

        if (cancelled) return;

        if (meRes.status === 'fulfilled' && meRes.value) {
          if (meRes.value.watchlist) setWatchlist(meRes.value.watchlist);
          if (meRes.value.portfolio) setPortfolio(meRes.value.portfolio);
        }
        if (picksRes.status === 'fulfilled' && picksRes.value) {
          setPicks(picksRes.value.picks ?? []);
          setIsOwner(picksRes.value.isOwner ?? false);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Load FMP stock universe + quotes
  useEffect(() => {
    let cancelled = false;
    async function loadStocks() {
      try {
        const key = localStorage.getItem('ii_fmp_key') || 'n2TIc6JypdMUhyFVtxrdqDBv0dIsK2Zg';
        const res = await fetch(
          `https://financialmodelingprep.com/stable/company-screener?marketCapMoreThan=2000&exchange=NASDAQ,NYSE&apikey=${key}`
        );
        if (!res.ok) return;
        const stocks: Stock[] = await res.json();
        if (cancelled) return;

        const stockBySym: Record<string, Stock> = {};
        stocks.forEach(s => { stockBySym[s.symbol] = s; });

        const adv = stocks.filter(s => s.changesPercentage > 0).length;
        const dec = stocks.filter(s => s.changesPercentage < 0).length;
        const unch = stocks.length - adv - dec;

        setData(prev => ({
          ...prev,
          stocks,
          stockBySym,
          breadth: { advancers: adv, decliners: dec, unchanged: unch },
        }));
      } catch {
        // ignore
      }
    }
    loadStocks();
    return () => { cancelled = true; };
  }, []);

  // Debounced save
  const saveMe = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await fetch('/api/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ watchlist, portfolio }),
        });
      } catch {
        // ignore
      }
    }, 700);
  }, [watchlist, portfolio]);

  const savePicks = useCallback(() => {
    if (picksTimer.current) clearTimeout(picksTimer.current);
    picksTimer.current = setTimeout(async () => {
      try {
        await fetch('/api/picks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ picks }),
        });
      } catch {
        // ignore
      }
    }, 800);
  }, [picks]);

  const addTicker = (sym: string) => {
    const up = sym.toUpperCase();
    if (!watchlist.includes(up)) {
      setWatchlist([up, ...watchlist]);
      saveMe();
    }
  };

  const removeTicker = (sym: string) => {
    setWatchlist(watchlist.filter(s => s !== sym));
    saveMe();
  };

  const handlePicksChange = (newPicks: Pick[]) => {
    setPicks(newPicks);
    if (isOwner) savePicks();
  };

  const handlePortfolioChange = (newPortfolio: Portfolio) => {
    setPortfolio(newPortfolio);
    saveMe();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ fontSize: 14, color: '#6b7280' }}>Loading terminal…</div>
      </div>
    );
  }

  return (
    <div>
      <PulseBar pulse={data.pulse} breadth={data.breadth} />

      <div style={{ padding: 16, maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 320px', gap: 16 }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <WatchlistPanel
              watchlist={watchlist}
              stocks={data.stocks}
              onAdd={addTicker}
              onRemove={removeTicker}
              onSelect={setSelected}
            />
            <PortfolioPanel
              portfolio={portfolio}
              stocks={data.stocks}
              onChange={handlePortfolioChange}
            />
          </div>

          {/* Center column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {selected ? (
              <div style={{
                background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{selected.symbol}</h2>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>{selected.name}</div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    style={{ fontSize: 12, padding: '4px 10px', borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
                  >
                    Close
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#111' }}>${selected.price.toFixed(2)}</div>
                    <div style={{
                      fontSize: 14, fontWeight: 600,
                      color: selected.changesPercentage >= 0 ? '#16a34a' : '#dc2626',
                    }}>
                      {selected.changesPercentage >= 0 ? '+' : ''}{selected.changesPercentage.toFixed(2)}%
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 24px', fontSize: 12 }}>
                    <div><span style={{ color: '#6b7280' }}>Market Cap</span><br/><b>${(selected.marketCap / 1e9).toFixed(1)}B</b></div>
                    <div><span style={{ color: '#6b7280' }}>P/E</span><br/><b>{selected.pe?.toFixed(1) ?? '—'}</b></div>
                    <div><span style={{ color: '#6b7280' }}>EPS</span><br/><b>{selected.eps?.toFixed(2) ?? '—'}</b></div>
                    <div><span style={{ color: '#6b7280' }}>Div Yield</span><br/><b>{selected.dividendYield ? (selected.dividendYield * 100).toFixed(2) + '%' : '—'}</b></div>
                    <div><span style={{ color: '#6b7280' }}>Sector</span><br/><b>{selected.sector ?? '—'}</b></div>
                    <div><span style={{ color: '#6b7280' }}>Beta</span><br/><b>{selected.beta?.toFixed(2) ?? '—'}</b></div>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={() => {
                      if (watchlist.includes(selected.symbol)) removeTicker(selected.symbol);
                      else addTicker(selected.symbol);
                    }}
                    style={{
                      fontSize: 12, padding: '6px 14px', borderRadius: 4,
                      border: 'none', background: watchlist.includes(selected.symbol) ? '#dc2626' : '#111',
                      color: '#fff', cursor: 'pointer',
                    }}
                  >
                    {watchlist.includes(selected.symbol) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 40,
                textAlign: 'center', color: '#9ca3af', fontSize: 14,
              }}>
                Select a stock from your watchlist to see details
              </div>
            )}

            <NewsPanel news={data.news} watchlistSymbols={watchlist} />
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <PicksPanel
              picks={picks}
              stocks={data.stocks}
              isOwner={isOwner}
              onChange={handlePicksChange}
              onSelect={setSelected}
            />
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 16 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#111' }}>Screener Presets</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.presets.map(p => (
                  <a
                    key={p.id}
                    href={`/screener?preset=${p.id}`}
                    style={{
                      fontSize: 12, padding: '8px 10px', borderRadius: 4,
                      background: '#f9fafb', color: '#111', textDecoration: 'none',
                      border: '1px solid transparent',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; }}
                  >
                    <b>{p.label}</b>
                    <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{p.query}</div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
