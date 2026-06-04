import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { Stock } from '../types/terminal';

interface WatchlistPanelProps {
  watchlist: string[];
  stocks: Stock[];
  onAdd: (sym: string) => void;
  onRemove: (sym: string) => void;
  onSelect: (stock: Stock) => void;
}

export const WatchlistPanel: React.FC<WatchlistPanelProps> = ({
  watchlist,
  stocks,
  onAdd,
  onRemove,
  onSelect,
}) => {
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const matches = useMemo(() => {
    if (!q.trim()) return [];
    const up = q.toUpperCase();
    return stocks
      .filter(s =>
        s.symbol.toUpperCase().includes(up) ||
        (s.name?.toUpperCase().includes(up) ?? false)
      )
      .slice(0, 8);
  }, [q, stocks]);

  const watchlistStocks = useMemo(() => {
    const bySym = new Map(stocks.map(s => [s.symbol, s]));
    return watchlist.map(sym => bySym.get(sym)).filter((s): s is Stock => !!s);
  }, [watchlist, stocks]);

  return (
    <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111' }}>Watchlist</h3>
        <button
          onClick={() => setAdding(a => !a)}
          style={{
            fontSize: 12, padding: '4px 10px', borderRadius: 4,
            border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer',
          }}
        >
          {adding ? 'Done' : '+ Add'}
        </button>
      </div>

      {adding && (
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search ticker..."
            style={{
              width: '100%', padding: '6px 10px', fontSize: 13,
              border: '1px solid #d1d5db', borderRadius: 4,
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && matches[0]) {
                onAdd(matches[0].symbol);
                setQ('');
                setAdding(false);
              }
            }}
          />
          {matches.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4,
              marginTop: 4, zIndex: 10, maxHeight: 200, overflowY: 'auto',
            }}>
              {matches.map(s => (
                <div
                  key={s.symbol}
                  onClick={() => { onAdd(s.symbol); setQ(''); setAdding(false); }}
                  style={{ padding: '6px 10px', cursor: 'pointer', fontSize: 13 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                >
                  <b>{s.symbol}</b> — {s.name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {watchlistStocks.map(s => (
          <div
            key={s.symbol}
            onClick={() => onSelect(s)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
              border: '1px solid transparent',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>{s.symbol}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>${(s.price ?? 0).toFixed(2)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: (s.changesPercentage ?? 0) >= 0 ? '#16a34a' : '#dc2626',
              }}>
                {(s.changesPercentage ?? 0) >= 0 ? '+' : ''}{(s.changesPercentage ?? 0).toFixed(1)}%
              </span>
              <button
                onClick={e => { e.stopPropagation(); onRemove(s.symbol); }}
                style={{
                  fontSize: 11, color: '#9ca3af', background: 'none', border: 'none',
                  cursor: 'pointer', padding: '2px 4px',
                }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
        {watchlistStocks.length === 0 && (
          <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: 16 }}>
            No stocks in watchlist
          </div>
        )}
      </div>
    </div>
  );
};
