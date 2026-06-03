import React, { useState } from 'react';
import type { Portfolio, Stock } from '../types/terminal';

interface PortfolioPanelProps {
  portfolio: Portfolio;
  stocks: Stock[];
  onChange: (portfolio: Portfolio) => void;
}

export const PortfolioPanel: React.FC<PortfolioPanelProps> = ({
  portfolio,
  stocks,
  onChange,
}) => {
  const [editing, setEditing] = useState(false);
  const [q, setQ] = useState('');
  const [sharesStr, setSharesStr] = useState('');
  const [costStr, setCostStr] = useState('');

  const bySym = new Map(stocks.map(s => [s.symbol, s]));

  const totalValue = portfolio.holdings.reduce((sum, h) => {
    const stock = bySym.get(h.symbol);
    return sum + (stock ? stock.price * h.shares : 0);
  }, portfolio.cash);

  const totalCost = portfolio.holdings.reduce((sum, h) => sum + h.costBasis * h.shares, 0);
  const totalPnL = totalValue - totalCost - portfolio.cash;
  const dayChange = portfolio.holdings.reduce((sum, h) => {
    const stock = bySym.get(h.symbol);
    return sum + (stock ? stock.price * stock.changesPercentage / 100 * h.shares : 0);
  }, 0);

  const addHolding = () => {
    const sym = q.toUpperCase().trim();
    const shares = parseFloat(sharesStr);
    const cost = parseFloat(costStr);
    if (!sym || !shares || shares <= 0 || !cost || cost <= 0) return;
    const exists = portfolio.holdings.find(h => h.symbol === sym);
    const newHoldings = exists
      ? portfolio.holdings.map(h => h.symbol === sym
        ? { ...h, shares: h.shares + shares, costBasis: (h.costBasis * h.shares + cost * shares) / (h.shares + shares) }
        : h)
      : [...portfolio.holdings, { symbol: sym, shares, costBasis: cost }];
    onChange({ ...portfolio, holdings: newHoldings });
    setQ('');
    setSharesStr('');
    setCostStr('');
  };

  const removeHolding = (sym: string) => {
    onChange({ ...portfolio, holdings: portfolio.holdings.filter(h => h.symbol !== sym) });
  };

  return (
    <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111' }}>Portfolio</h3>
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
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Total Value</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>P/L</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: totalPnL >= 0 ? '#16a34a' : '#dc2626' }}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Day Change</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: dayChange >= 0 ? '#16a34a' : '#dc2626' }}>
            {dayChange >= 0 ? '+' : ''}${dayChange.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Cash</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>${portfolio.cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
      </div>

      {editing && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Symbol" style={{ fontSize: 12, padding: '4px 8px', width: 80, border: '1px solid #d1d5db', borderRadius: 4 }} />
          <input value={sharesStr} onChange={e => setSharesStr(e.target.value)} placeholder="Shares" type="number" style={{ fontSize: 12, padding: '4px 8px', width: 80, border: '1px solid #d1d5db', borderRadius: 4 }} />
          <input value={costStr} onChange={e => setCostStr(e.target.value)} placeholder="Cost basis" type="number" style={{ fontSize: 12, padding: '4px 8px', width: 80, border: '1px solid #d1d5db', borderRadius: 4 }} />
          <button onClick={addHolding} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 4, border: 'none', background: '#111', color: '#fff', cursor: 'pointer' }}>Add</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {portfolio.holdings.map(h => {
          const stock = bySym.get(h.symbol);
          const value = stock ? stock.price * h.shares : 0;
          const cost = h.costBasis * h.shares;
          const pl = value - cost;
          const plPct = cost > 0 ? (pl / cost) * 100 : 0;
          return (
            <div key={h.symbol} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: 4, background: '#f9fafb' }}>
              <div>
                <b style={{ fontSize: 12 }}>{h.symbol}</b>
                <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 6 }}>{h.shares} shares @ ${h.costBasis.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  <div style={{ fontSize: 11, color: pl >= 0 ? '#16a34a' : '#dc2626' }}>
                    {pl >= 0 ? '+' : ''}{plPct.toFixed(1)}%
                  </div>
                </div>
                {editing && (
                  <button onClick={() => removeHolding(h.symbol)} style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                )}
              </div>
            </div>
          );
        })}
        {portfolio.holdings.length === 0 && (
          <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: 12 }}>
            No holdings
          </div>
        )}
      </div>
    </div>
  );
};
