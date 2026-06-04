import React, { useState } from 'react';
import type { Pick, Stock } from '../types/terminal';

interface PicksPanelProps {
  picks: Pick[];
  stocks: Stock[];
  isOwner: boolean;
  onChange: (picks: Pick[]) => void;
  onSelect: (stock: Stock) => void;
}

function ScoreRing({ score, size = 32 }: { score: number; size?: number }) {
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  const pct = clamp(score, 0, 100) / 100;
  const color = score >= 85 ? '#22c55e' : score >= 75 ? '#0ea5e9' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={3} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={`${c * pct} ${c * (1 - pct)}`}
        strokeDashoffset={-c * 0.25}
        strokeLinecap="round"
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={size * 0.35} fontWeight={700} fill={color}>
        {score}
      </text>
    </svg>
  );
}

function ConvDots({ level }: { level: 'high' | 'medium' | 'low' }) {
  const n = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  return (
    <span style={{ display: 'flex', gap: 3 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: i < n ? '#2563eb' : '#e5e7eb',
        }} />
      ))}
    </span>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export const PicksPanel: React.FC<PicksPanelProps> = ({
  picks,
  stocks,
  isOwner,
  onChange: _onChange,
  onSelect,
}) => {
  const [editing, setEditing] = useState(false);
  const bySym = new Map(stocks.map(s => [s.symbol, s]));

  return (
    <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111' }}>Quality Picks</h3>
        {isOwner && (
          <button
            onClick={() => setEditing(e => !e)}
            style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 4,
              border: '1px solid #d1d5db', background: editing ? '#111' : '#fff',
              color: editing ? '#fff' : '#374151', cursor: 'pointer',
            }}
          >
            {editing ? 'Done' : 'Edit'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {picks.map((pick) => {
          const stock = bySym.get(pick.symbol);
          return (
            <div
              key={pick.symbol}
              onClick={() => stock && onSelect(stock)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: 10, borderRadius: 6, cursor: 'pointer',
                border: pick.featured ? '1px solid #fbbf24' : '1px solid transparent',
                background: pick.featured ? '#fffbeb' : '#f9fafb',
              }}
            >
              <ScoreRing score={pick.score} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <b style={{ fontSize: 13, color: '#111' }}>{pick.symbol}</b>
                  <span style={{
                    fontSize: 10, padding: '1px 5px', borderRadius: 3,
                    background: pick.sentiment === 'bullish' ? '#dcfce7'
                      : pick.sentiment === 'bearish' ? '#fee2e2'
                      : '#f3f4f6',
                    color: pick.sentiment === 'bullish' ? '#166534'
                      : pick.sentiment === 'bearish' ? '#991b1b'
                      : '#374151',
                  }}>
                    {pick.sentiment}
                  </span>
                  <ConvDots level={pick.conviction} />
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.3 }}>
                  {pick.narrative}
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                  {pick.tags.map(t => (
                    <span key={t} style={{ fontSize: 10, color: '#2563eb', background: '#eff6ff', padding: '1px 5px', borderRadius: 3 }}>
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
              {stock && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>${(stock.price ?? 0).toFixed(2)}</div>
                  <div style={{
                    fontSize: 11, fontWeight: 600,
                    color: (stock.changesPercentage ?? 0) >= 0 ? '#16a34a' : '#dc2626',
                  }}>
                    {(stock.changesPercentage ?? 0) >= 0 ? '+' : ''}{(stock.changesPercentage ?? 0).toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {picks.length === 0 && (
          <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: 16 }}>
            No picks available
          </div>
        )}
      </div>
    </div>
  );
};
