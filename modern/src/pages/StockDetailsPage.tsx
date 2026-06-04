import { useState } from 'react'
import { useTickerData } from '@/hooks'
import IntrinsicValuationSection from '../components/IntrinsicValuationSection'

export default function StockDetailsPage() {
  const [input, setInput] = useState('AAPL')
  const [ticker, setTicker] = useState('AAPL')
  const { data, loading, error, refresh } = useTickerData(ticker)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const t = input.trim().toUpperCase()
    if (t) setTicker(t)
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search ticker..."
          style={{
            flex: 1,
            maxWidth: 300,
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            fontSize: 14,
            fontFamily: 'var(--sans)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Load
        </button>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: '1px solid var(--border2)',
            background: 'var(--panel)',
            color: 'var(--fg)',
            fontWeight: 500,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </form>

      {error && (
        <div style={{
          padding: '14px 18px',
          background: 'rgba(178,59,59,0.06)',
          border: '1px solid rgba(178,59,59,0.2)',
          borderRadius: 8,
          color: 'var(--red)',
          marginBottom: 24,
          fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {loading && !data && (
        <div style={{ color: 'var(--muted)', padding: 40, textAlign: 'center' }}>
          <div style={{
            width: 32,
            height: 32,
            border: '3px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
            margin: '0 auto 16px',
          }} />
          Loading {ticker}…
        </div>
      )}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Hero */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>
                {data.profile?.companyName ?? ticker}
              </h1>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  fontWeight: 700,
                  background: 'hsl(208,52%,36%,0.12)',
                  color: 'var(--accent)',
                  border: '1px solid hsl(208,52%,36%,0.25)',
                  padding: '2px 8px',
                  borderRadius: 999,
                }}>
                  {ticker}
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--panel)', border: '1px solid var(--border)', padding: '2px 7px', borderRadius: 999 }}>
                  {data.profile?.exchange ?? '—'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--panel)', border: '1px solid var(--border)', padding: '2px 7px', borderRadius: 999 }}>
                  {data.profile?.sector ?? '—'}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>
                ${data.quote?.price?.toFixed(2) ?? '—'}
              </div>
              {data.quote?.change != null && (
                <div style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: data.quote.change >= 0 ? 'var(--green)' : 'var(--red)',
                }}>
                  {data.quote.change >= 0 ? '+' : ''}{data.quote.change.toFixed(2)} {' '}
                  ({data.quote.changesPercentage != null
                    ? `${data.quote.changesPercentage >= 0 ? '+' : ''}${data.quote.changesPercentage.toFixed(2)}%`
                    : '—'})
                </div>
              )}
            </div>
          </div>

          {/* Key Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 1,
            background: 'var(--border)',
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid var(--border)',
          }}>
            {[
              { label: 'Market Cap', value: fmtCap(data.quote?.marketCap) },
              { label: 'P/E', value: data.quote?.pe?.toFixed(1) ?? '—' },
              { label: 'EPS', value: data.quote?.eps?.toFixed(2) ?? '—' },
              { label: '52W Range', value: data.profile?.range ?? '—' },
              { label: 'Volume', value: fmtVol(data.quote?.volume) },
              { label: 'Avg Volume', value: fmtVol(data.quote?.avgVolume) },
              { label: 'Beta', value: data.profile?.beta?.toFixed(2) ?? '—' },
              { label: 'Currency', value: data.profile?.currency ?? 'USD' },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: 'var(--panel)',
                padding: '12px 16px',
              }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  {stat.label}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600 }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Financials Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <MetricCard
              title="Income Statement"
              rows={[
                { label: 'Revenue (TTM)', value: fmtMoney(data.income[0]?.revenue) },
                { label: 'Gross Profit', value: fmtMoney(data.income[0]?.grossProfit) },
                { label: 'Operating Income', value: fmtMoney(data.income[0]?.operatingIncome) },
                { label: 'Net Income', value: fmtMoney(data.income[0]?.netIncome) },
                { label: 'EBITDA', value: fmtMoney(data.income[0]?.ebitda) },
              ]}
            />
            <MetricCard
              title="Balance Sheet"
              rows={[
                { label: 'Total Assets', value: fmtMoney(data.balance[0]?.totalAssets) },
                { label: 'Total Debt', value: fmtMoney(data.balance[0]?.totalDebt) },
                { label: 'Cash', value: fmtMoney(data.balance[0]?.cashAndCashEquivalents) },
                { label: 'Equity', value: fmtMoney(data.balance[0]?.totalStockholdersEquity) },
                { label: 'Current Ratio', value: data.metrics[0]?.currentRatio?.toFixed(2) ?? '—' },
              ]}
            />
            <MetricCard
              title="Cash Flow"
              rows={[
                { label: 'Operating CF', value: fmtMoney(data.cashflow[0]?.operatingCashFlow) },
                { label: 'Free Cash Flow', value: fmtMoney(data.cashflow[0]?.freeCashFlow) },
                { label: 'CapEx', value: fmtMoney(data.cashflow[0]?.capitalExpenditure) },
                { label: 'Dividends', value: fmtMoney(data.cashflow[0]?.dividendsPaid) },
                { label: 'FCF Yield', value: data.metrics[0]?.freeCashFlowYield ? `${(data.metrics[0].freeCashFlowYield * 100).toFixed(2)}%` : '—' },
              ]}
            />
          </div>

          {/* ── Intrinsic Valuation ── */}
          {data && <IntrinsicValuationSection data={data} />}

          {/* Description */}
          {data.profile?.description && (
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '18px 20px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                About
              </div>
              <p style={{ fontSize: 13, color: 'var(--fg2)', lineHeight: 1.7 }}>
                {data.profile.description}
              </p>
            </div>
          )}

          {/* Raw Data Toggle (dev) */}
          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: 12, color: 'var(--muted)', cursor: 'pointer', fontWeight: 500 }}>
              Raw API Response (dev)
            </summary>
            <pre style={{
              fontSize: 11,
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 16,
              overflow: 'auto',
              maxHeight: 400,
              marginTop: 8,
            }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}

function MetricCard({ title, rows }: { title: string; rows: { label: string; value: string }[] }) {
  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '16px 18px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {rows.map((row, i) => (
          <div key={row.label} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '9px 0',
            borderBottom: i < rows.length - 1 ? '1px solid rgba(20,20,18,0.05)' : 'none',
          }}>
            <span style={{ fontSize: 12.5, color: 'var(--fg2)' }}>{row.label}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600 }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Formatters ───────────────────────────────────────────────────────────────

function fmtMoney(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T'
  if (abs >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B'
  if (abs >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M'
  if (abs >= 1e3) return '$' + (n / 1e3).toFixed(2) + 'K'
  return '$' + n.toFixed(2)
}

function fmtCap(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T'
  if (abs >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B'
  if (abs >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M'
  return '$' + n.toFixed(0)
}

function fmtVol(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (abs >= 1e3) return (n / 1e3).toFixed(2) + 'K'
  return n.toFixed(0)
}
