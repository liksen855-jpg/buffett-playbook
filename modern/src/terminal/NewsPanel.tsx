import React, { useState, useMemo } from 'react';
import type { NewsItem } from '../types/terminal';

interface NewsPanelProps {
  news: NewsItem[];
  watchlistSymbols: string[];
}

export const NewsPanel: React.FC<NewsPanelProps> = ({ news, watchlistSymbols }) => {
  const [scope, setScope] = useState<'watchlist' | 'all'>('watchlist');

  const items = useMemo(() => {
    const set = new Set(watchlistSymbols.map(s => s.toUpperCase()));
    const filtered = scope === 'watchlist'
      ? news.filter(n => set.has(n.symbol.toUpperCase()))
      : news;
    return filtered.slice(0, 20);
  }, [news, watchlistSymbols, scope]);

  return (
    <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111' }}>News</h3>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['watchlist', 'all'] as const).map(s => (
            <button
              key={s}
              onClick={() => setScope(s)}
              style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 4,
                border: '1px solid #d1d5db', background: scope === s ? '#111' : '#fff',
                color: scope === s ? '#fff' : '#374151', cursor: 'pointer',
              }}
            >
              {s === 'watchlist' ? 'Watchlist' : 'All'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((n, i) => (
          <a
            key={i}
            href={n.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#fff', background: '#2563eb',
                  padding: '1px 5px', borderRadius: 3,
                }}>
                  {n.symbol}
                </span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>
                  {n.site || 'News'} • {new Date(n.publishedDate).toLocaleDateString()}
                </span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111', lineHeight: 1.4 }}>
                {n.title}
              </div>
              {n.snippet && (
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3, lineHeight: 1.4 }}>
                  {n.snippet.slice(0, 140)}{n.snippet.length > 140 ? '…' : ''}
                </div>
              )}
            </div>
          </a>
        ))}
        {items.length === 0 && (
          <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: 16 }}>
            No news items
          </div>
        )}
      </div>
    </div>
  );
};
