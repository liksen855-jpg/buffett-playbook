import React from 'react';
import type { PulseTile, Breadth } from '../types/terminal';

function signed(n: number, digits = 2): string {
  const s = n.toFixed(digits);
  return n >= 0 ? '+' + s : s;
}

interface PulseBarProps {
  pulse: PulseTile[];
  breadth: Breadth;
}

export const PulseBar: React.FC<PulseBarProps> = ({ pulse, breadth }) => {
  const total = breadth.advancers + breadth.decliners + breadth.unchanged;
  const advPct = total > 0 ? (breadth.advancers / total) * 100 : 50;

  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {pulse.map(tile => (
          <div key={tile.symbol} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: '#111' }}>{tile.name || tile.symbol}</span>
            <span style={{ fontSize: 13, color: '#374151' }}>${tile.price.toFixed(2)}</span>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: tile.changesPercentage >= 0 ? '#16a34a' : '#dc2626',
            }}>
              {signed(tile.changesPercentage, 1)}%
            </span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6b7280' }}>
          <span>Adv: <b style={{ color: '#16a34a' }}>{breadth.advancers}</b></span>
          <span>Dec: <b style={{ color: '#dc2626' }}>{breadth.decliners}</b></span>
          <span>Unch: <b>{breadth.unchanged}</b></span>
          <div style={{ width: 60, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${advPct}%`, height: '100%', background: '#16a34a', transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
