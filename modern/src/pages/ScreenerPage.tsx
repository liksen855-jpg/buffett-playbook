import { useState, useCallback, useEffect, useRef } from 'react'
import { INDUSTRIES_BY_SECTOR } from '../data/industries'
import type { Stock } from '../types/terminal'

interface Filters {
  exchange: string[]
  marketCapMin: string
  marketCapMax: string
  sector: string
  industry: string
  peMin: string
  peMax: string
  dividendMin: string
  roeMin: string
  debtEquityMax: string
}

const DEFAULT_FILTERS: Filters = {
  exchange: ['NASDAQ', 'NYSE'],
  marketCapMin: '2000',
  marketCapMax: '',
  sector: '',
  industry: '',
  peMin: '',
  peMax: '',
  dividendMin: '',
  roeMin: '',
  debtEquityMax: '',
}

const EXCHANGES = ['NASDAQ', 'NYSE', 'AMEX']

export default function ScreenerPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [results, setResults] = useState<Stock[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  const seqRef = useRef(0)

  const buildQuery = useCallback((f: Filters): string => {
    const params = new URLSearchParams()
    if (f.exchange.length) params.set('exchange', f.exchange.join(','))
    if (f.marketCapMin) params.set('marketCapMoreThan', f.marketCapMin)
    if (f.marketCapMax) params.set('marketCapLowerThan', f.marketCapMax)
    if (f.sector) params.set('sector', f.sector)
    if (f.industry) params.set('industry', f.industry)
    if (f.peMin) params.set('peMoreThan', f.peMin)
    if (f.peMax) params.set('peLowerThan', f.peMax)
    if (f.dividendMin) params.set('dividendMoreThan', f.dividendMin)
    if (f.roeMin) params.set('roeMoreThan', f.roeMin)
    if (f.debtEquityMax) params.set('debtToEquityRatioLowerThan', f.debtEquityMax)
    params.set('limit', '100')
    return params.toString()
  }, [])

  const runScreen = useCallback(async () => {
    const seq = ++seqRef.current
    setLoading(true)
    setError(null)
    try {
      const key = localStorage.getItem('ii_fmp_key') || 'n2TIc6JypdMUhyFVtxrdqDBv0dIsK2Zg'
      const query = buildQuery(filters)
      const url = `https://financialmodelingprep.com/stable/company-screener?${query}&apikey=${key}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`FMP returned ${res.status}`)
      const data: Stock[] = await res.json()
      if (seq !== seqRef.current) return
      if (!Array.isArray(data)) {
        setError('Invalid response from FMP')
        setResults([])
        setCount(0)
        return
      }
      setResults(data)
      setCount(data.length)
    } catch (e) {
      if (seq !== seqRef.current) return
      setError(e instanceof Error ? e.message : 'Screen failed')
      setResults([])
      setCount(0)
    } finally {
      if (seq === seqRef.current) setLoading(false)
    }
  }, [filters, buildQuery])

  useEffect(() => {
    runScreen()
  }, [])

  const toggleExchange = (ex: string) => {
    setFilters(prev => ({
      ...prev,
      exchange: prev.exchange.includes(ex)
        ? prev.exchange.filter(x => x !== ex)
        : [...prev.exchange, ex],
    }))
  }

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const fmtCap = (n: number | undefined) => {
    if (n == null || isNaN(n)) return '—'
    const abs = Math.abs(n)
    if (abs >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T'
    if (abs >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B'
    if (abs >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M'
    return '$' + n.toFixed(0)
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: 24, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      {/* Sidebar Filters */}
      <div style={{ width: 280, flexShrink: 0 }}>
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 20,
          position: 'sticky',
          top: 80,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--fg)' }}>
            Filters
          </div>

          {/* Exchange */}
          <FilterGroup label="Exchange">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EXCHANGES.map(ex => (
                <button
                  key={ex}
                  onClick={() => toggleExchange(ex)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                    background: filters.exchange.includes(ex) ? 'var(--accent)' : 'var(--bg)',
                    color: filters.exchange.includes(ex) ? '#fff' : 'var(--fg2)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </FilterGroup>

          {/* Market Cap */}
          <FilterGroup label="Market Cap ($M)">
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                placeholder="Min"
                value={filters.marketCapMin}
                onChange={e => updateFilter('marketCapMin', e.target.value)}
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.marketCapMax}
                onChange={e => updateFilter('marketCapMax', e.target.value)}
                style={inputStyle}
              />
            </div>
          </FilterGroup>

          {/* Sector */}
          <FilterGroup label="Sector">
            <select
              value={filters.sector}
              onChange={e => updateFilter('sector', e.target.value)}
              style={{ ...inputStyle, width: '100%' }}
            >
              <option value="">All Sectors</option>
              {Object.keys(INDUSTRIES_BY_SECTOR).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </FilterGroup>

          {/* Industry — Finviz-style optgroup */}
          <FilterGroup label="Industry">
            <select
              value={filters.industry}
              onChange={e => updateFilter('industry', e.target.value)}
              style={{ ...inputStyle, width: '100%' }}
            >
              <option value="">All Industries</option>
              {Object.entries(INDUSTRIES_BY_SECTOR).map(([sector, industries]) => (
                <optgroup key={sector} label={sector}>
                  {industries.map(ind => (
                    <option key={ind.value} value={ind.value}>{ind.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </FilterGroup>

          {/* P/E */}
          <FilterGroup label="P/E Ratio">
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                placeholder="Min"
                value={filters.peMin}
                onChange={e => updateFilter('peMin', e.target.value)}
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.peMax}
                onChange={e => updateFilter('peMax', e.target.value)}
                style={inputStyle}
              />
            </div>
          </FilterGroup>

          {/* Dividend */}
          <FilterGroup label="Dividend Yield > (%)">
            <input
              type="number"
              placeholder="e.g. 2"
              value={filters.dividendMin}
              onChange={e => updateFilter('dividendMin', e.target.value)}
              style={{ ...inputStyle, width: '100%' }}
            />
          </FilterGroup>

          {/* ROE */}
          <FilterGroup label="ROE > (%)">
            <input
              type="number"
              placeholder="e.g. 15"
              value={filters.roeMin}
              onChange={e => updateFilter('roeMin', e.target.value)}
              style={{ ...inputStyle, width: '100%' }}
            />
          </FilterGroup>

          {/* Debt/Equity */}
          <FilterGroup label="Debt / Equity <">
            <input
              type="number"
              placeholder="e.g. 1"
              value={filters.debtEquityMax}
              onChange={e => updateFilter('debtEquityMax', e.target.value)}
              style={{ ...inputStyle, width: '100%' }}
            />
          </FilterGroup>

          <button
            onClick={runScreen}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 0',
              borderRadius: 6,
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              marginTop: 8,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Scanning…' : 'Run Screen'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
            {count} result{count !== 1 ? 's' : ''}
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(178,59,59,0.06)',
            border: '1px solid rgba(178,59,59,0.2)',
            borderRadius: 8,
            color: 'var(--red)',
            marginBottom: 16,
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {loading && results.length === 0 && (
          <div style={{ color: 'var(--muted)', padding: 40, textAlign: 'center' }}>
            <div style={{
              width: 28,
              height: 28,
              border: '3px solid var(--border)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
              margin: '0 auto 12px',
            }} />
            Loading screener…
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 40,
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: 13,
          }}>
            No stocks match your filters.
          </div>
        )}

        {results.length > 0 && (
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'auto',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Symbol', 'Name', 'Price', 'Change %', 'Market Cap', 'P/E', 'Sector', 'Industry'].map(h => (
                    <th key={h} style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: 'var(--muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: 10,
                      whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((s, i) => (
                  <tr
                    key={s.symbol}
                    style={{
                      borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)', fontWeight: 700 }}>
                      {s.symbol}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--fg2)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)' }}>
                      ${(s.price ?? 0).toFixed(2)}
                    </td>
                    <td style={{
                      padding: '10px 12px',
                      fontFamily: 'var(--mono)',
                      fontWeight: 600,
                      color: (s.changesPercentage ?? 0) >= 0 ? 'var(--green)' : 'var(--red)',
                    }}>
                      {(s.changesPercentage ?? 0) >= 0 ? '+' : ''}{(s.changesPercentage ?? 0).toFixed(2)}%
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)' }}>
                      {fmtCap(s.marketCap)}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)' }}>
                      {s.pe != null ? s.pe.toFixed(1) : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--fg2)' }}>
                      {s.sector ?? '—'}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--fg2)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.industry ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 4,
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--fg)',
  fontSize: 12,
  fontFamily: 'var(--sans)',
  outline: 'none',
  width: '100%',
}
