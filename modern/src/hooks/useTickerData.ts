/**
 * React hook for loading all financial data for a single ticker.
 *
 * Fetches all 12 endpoints in parallel, with individual error isolation.
 * If one endpoint fails (e.g., DCF unavailable), the rest still load.
 *
 * Usage:
 *   const { data, loading, error, refresh } = useTickerData('AAPL')
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { fmpFetchAll } from '@/api/fmp-client'
import {
  CompanyProfileArraySchema,
  QuoteArraySchema,
  IncomeStatementArraySchema,
  BalanceSheetArraySchema,
  CashFlowArraySchema,
  KeyMetricsArraySchema,
  DCFArraySchema,
  HistoricalPriceLightArraySchema,
  EarningsArraySchema,
} from '@/api/types'
import type {
  CompanyProfile,
  Quote,
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
  KeyMetrics,
  DCF,
  HistoricalPriceLight,
  Earnings,
} from '@/api/types'

export interface TickerData {
  profile: CompanyProfile | null
  quote: Quote | null
  income: IncomeStatement[]
  incomeQ: IncomeStatement[]
  balance: BalanceSheet[]
  balanceQ: BalanceSheet[]
  cashflow: CashFlowStatement[]
  cashflowQ: CashFlowStatement[]
  metrics: KeyMetrics[]
  dcf: DCF | null
  priceHistory: HistoricalPriceLight[]
  earnings: Earnings[]
}

interface UseTickerDataResult {
  data: TickerData | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useTickerData(symbol: string | null): UseTickerDataResult {
  const [data, setData] = useState<TickerData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const seqRef = useRef(0)

  const load = useCallback(async () => {
    if (!symbol) {
      setData(null)
      setError(null)
      return
    }

    const ticker = symbol.toUpperCase().trim()
    const seq = ++seqRef.current
    setLoading(true)
    setError(null)

    try {
      const results = await fmpFetchAll({
        profile: {
          path: `/profile?symbol=${encodeURIComponent(ticker)}`,
          schema: CompanyProfileArraySchema,
        },
        quote: {
          path: `/quote?symbol=${encodeURIComponent(ticker)}`,
          schema: QuoteArraySchema,
        },
        income: {
          path: `/income-statement?symbol=${encodeURIComponent(ticker)}&limit=10`,
          schema: IncomeStatementArraySchema,
        },
        balance: {
          path: `/balance-sheet-statement?symbol=${encodeURIComponent(ticker)}&limit=10`,
          schema: BalanceSheetArraySchema,
        },
        cashflow: {
          path: `/cash-flow-statement?symbol=${encodeURIComponent(ticker)}&limit=10`,
          schema: CashFlowArraySchema,
        },
        metrics: {
          path: `/key-metrics?symbol=${encodeURIComponent(ticker)}&limit=10`,
          schema: KeyMetricsArraySchema,
        },
        dcf: {
          path: `/discounted-cash-flow?symbol=${encodeURIComponent(ticker)}`,
          schema: DCFArraySchema,
        },
        priceHistory: {
          path: `/historical-price-eod/light?symbol=${encodeURIComponent(ticker)}&limit=1095`,
          schema: HistoricalPriceLightArraySchema,
        },
        incomeQ: {
          path: `/income-statement?symbol=${encodeURIComponent(ticker)}&period=quarter&limit=5`,
          schema: IncomeStatementArraySchema,
        },
        balanceQ: {
          path: `/balance-sheet-statement?symbol=${encodeURIComponent(ticker)}&period=quarter&limit=5`,
          schema: BalanceSheetArraySchema,
        },
        cashflowQ: {
          path: `/cash-flow-statement?symbol=${encodeURIComponent(ticker)}&period=quarter&limit=5`,
          schema: CashFlowArraySchema,
        },
        earnings: {
          path: `/earnings?symbol=${encodeURIComponent(ticker)}`,
          schema: EarningsArraySchema,
        },
      })

      // If a newer load started while we were awaiting, abandon this one
      if (seq !== seqRef.current) return

      // Profile is the only truly required endpoint
      if (!results.profile || results.profile.length === 0) {
        setError(`Ticker "${ticker}" not found.`)
        setData(null)
        setLoading(false)
        return
      }

      // Derive quote fallbacks from profile if quote is missing
      let quote = results.quote?.[0] ?? null
      const profile = results.profile[0]
      if (!quote && profile) {
        const rangeParts = profile.range?.split('-') ?? []
        quote = {
          symbol: profile.symbol ?? ticker,
          name: profile.companyName,
          price: profile.price,
          changesPercentage: null,
          change: null,
          dayLow: null,
          dayHigh: null,
          yearHigh: rangeParts[1] ? parseFloat(rangeParts[1]) : null,
          yearLow: rangeParts[0] ? parseFloat(rangeParts[0]) : null,
          marketCap: profile.mktCap,
          priceAvg50: null,
          priceAvg200: null,
          volume: null,
          avgVolume: profile.volAvg,
          exchange: profile.exchange,
          open: null,
          previousClose: null,
          eps: null,
          pe: null,
          earningsAnnouncement: null,
          sharesOutstanding: null,
          timestamp: null,
        }
      }

      setData({
        profile,
        quote,
        income: results.income ?? [],
        incomeQ: results.incomeQ ?? [],
        balance: results.balance ?? [],
        balanceQ: results.balanceQ ?? [],
        cashflow: results.cashflow ?? [],
        cashflowQ: results.cashflowQ ?? [],
        metrics: results.metrics ?? [],
        dcf: results.dcf?.[0] ?? null,
        priceHistory: (results.priceHistory ?? []).slice().reverse(),
        earnings: results.earnings ?? [],
      })
    } catch (e) {
      if (seq !== seqRef.current) return
      setError(e instanceof Error ? e.message : 'Unknown error loading ticker data')
      setData(null)
    } finally {
      if (seq === seqRef.current) setLoading(false)
    }
  }, [symbol])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refresh: load }
}