import { useState } from 'react'
import TerminalPage from './pages/TerminalPage'
import StockDetailsPage from './pages/StockDetailsPage'

type Page = 'terminal' | 'stock-details'

export default function App() {
  const [page, setPage] = useState<Page>('terminal')

  return (
    <div>
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 24px',
        display: 'flex',
        gap: 16,
        alignItems: 'center',
      }}>
        <strong style={{ fontSize: 15, letterSpacing: '-0.01em' }}>InsightInvest · Modern</strong>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setPage('terminal')}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              background: page === 'terminal' ? 'var(--accent-soft)' : 'transparent',
              color: page === 'terminal' ? 'var(--accent)' : 'var(--muted)',
              fontWeight: page === 'terminal' ? 600 : 500,
              fontSize: 13,
            }}
          >
            Terminal
          </button>
          <button
            onClick={() => setPage('stock-details')}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              background: page === 'stock-details' ? 'var(--accent-soft)' : 'transparent',
              color: page === 'stock-details' ? 'var(--accent)' : 'var(--muted)',
              fontWeight: page === 'stock-details' ? 600 : 500,
              fontSize: 13,
            }}
          >
            Stock Details
          </button>
        </div>
      </nav>

      {page === 'terminal' && <TerminalPage />}
      {page === 'stock-details' && <StockDetailsPage />}
    </div>
  )
}