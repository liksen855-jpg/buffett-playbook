import { useMemo } from 'react'
import {
  runValuation,
  computeEPV,
  computeOwnerEarningsYield,
  computeSixDimensions,
  computeBusinessQuality,
} from '../valuation'
import type { ValuationOutput, MoatHeatOutput, QualityGateOutput } from '../valuation'
import type { TickerData } from '../hooks/useTickerData'

interface Props {
  data: TickerData
}

export default function IntrinsicValuationSection({ data }: Props) {
  // ── Valuation computations ──
  const valuation = useMemo<ValuationOutput | null>(() => {
    if (!data || !data.income.length) return null
    const shares =
      data.income[0]?.weightedAverageShsOutDil ??
      data.quote?.sharesOutstanding ??
      0
    const price = data.quote?.price ?? 0
    if (!shares || !price) return null
    return runValuation({
      income: data.income,
      balance: data.balance,
      cashflow: data.cashflow,
      metrics: data.metrics,
      price,
      shares,
      sector: data.profile?.sector ?? undefined,
      beta: data.profile?.beta ?? undefined,
    })
  }, [data])

  const moat = useMemo<MoatHeatOutput | null>(() => {
    if (!data || !data.income.length) return null
    return computeSixDimensions({
      profile: data.profile,
      quote: data.quote,
      income: data.income,
      balance: data.balance,
      cashflow: data.cashflow,
      metrics: data.metrics,
      earnings: data.earnings,
      fairValue: valuation?.composite ?? null,
      beta: data.profile?.beta ?? undefined,
    })
  }, [data, valuation])

  const epv = useMemo(() => {
    if (!data || !data.income.length) return null
    const shares =
      data.income[0]?.weightedAverageShsOutDil ??
      data.quote?.sharesOutstanding ??
      0
    if (!shares) return null
    return computeEPV({
      income: data.income,
      balance: data.balance,
      cashflow: data.cashflow,
      metrics: data.metrics,
      price: data.quote?.price ?? 0,
      shares,
      beta: data.profile?.beta ?? undefined,
    })
  }, [data])

  const ownerYield = useMemo(() => {
    if (!data || !data.income.length) return null
    const shares =
      data.income[0]?.weightedAverageShsOutDil ??
      data.quote?.sharesOutstanding ??
      0
    if (!shares) return null
    return computeOwnerEarningsYield({
      income: data.income,
      balance: data.balance,
      cashflow: data.cashflow,
      metrics: data.metrics,
      price: data.quote?.price ?? 0,
      shares,
    })
  }, [data])

  const qualityGate = useMemo<QualityGateOutput | null>(() => {
    if (!data || !data.income.length) return null
    return computeBusinessQuality({
      income: data.income,
      balance: data.balance,
      cashflow: data.cashflow,
      metrics: data.metrics,
      beta: data.profile?.beta ?? undefined,
    })
  }, [data])

  return (
    <>
      {/* ── Valuation ── */}
      {valuation && (
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '18px 20px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 14,
            }}
          >
            Intrinsic Valuation
          </div>

          {/* Composite */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              marginBottom: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Composite Fair Value
              </div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 24,
                  fontWeight: 700,
                  color: 'var(--accent)',
                }}
              >
                {valuation.composite
                  ? `$${valuation.composite.toFixed(2)}`
                  : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Upside / Downside
              </div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 20,
                  fontWeight: 700,
                  color:
                    (valuation.upside ?? 0) >= 0
                      ? 'var(--green)'
                      : 'var(--red)',
                }}
              >
                {valuation.upside != null
                  ? `${valuation.upside >= 0 ? '+' : ''}${(
                      valuation.upside * 100
                    ).toFixed(1)}%`
                  : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Current Price
              </div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                ${data.quote?.price?.toFixed(2) ?? '—'}
              </div>
            </div>
          </div>

          {/* Method grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 8,
            }}
          >
            {valuation.results.map((r) => (
              <div
                key={r.method}
                style={{
                  padding: '10px 12px',
                  background: 'var(--bg)',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--muted)',
                    marginBottom: 4,
                  }}
                >
                  {r.method}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {r.value != null ? `$${r.value.toFixed(2)}` : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EPV & Owner Earnings ── */}
      {(epv || ownerYield) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {epv && (
            <div
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '16px 18px',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 10,
                }}
              >
                Earnings Power Value
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <Row label="WACC" value={`${(epv.wacc * 100).toFixed(1)}%`} />
                <Row label="NOPAT" value={fmtMoney(epv.nopat)} />
                <Row label="EPV" value={fmtMoney(epv.epv)} />
                <Row label="EPV / Share" value={`$${epv.epvPerShare.toFixed(2)}`} />
              </div>
            </div>
          )}
          {ownerYield && (
            <div
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '16px 18px',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 10,
                }}
              >
                Owner Earnings Yield
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <Row label="Net Income" value={fmtMoney(ownerYield.netIncome)} />
                <Row label="D&A" value={fmtMoney(ownerYield.da)} />
                <Row label="Maint. Capex" value={fmtMoney(ownerYield.maintCapex)} />
                <Row
                  label="Owner Earnings"
                  value={fmtMoney(ownerYield.ownerEarnings)}
                />
                <Row
                  label="Yield"
                  value={`${(ownerYield.yield * 100).toFixed(2)}%`}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 01 Quality Gate ── */}
      {qualityGate && (
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: '#0f172a',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#94a3b8',
                  background: 'rgba(255,255,255,0.08)',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                01
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#f8fafc',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Quality Gate
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#f8fafc',
                }}
              >
                {qualityGate.total}
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                  /100
                </span>
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  background: qualityGate.passed
                    ? 'rgba(34,197,94,0.2)'
                    : 'rgba(239,68,68,0.2)',
                  color: qualityGate.passed ? '#4ade80' : '#f87171',
                  border: `1px solid ${qualityGate.passed ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
                }}
              >
                {qualityGate.passed ? 'Pass' : 'Fail'}
              </span>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '16px 20px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              {/* ROIC vs WACC */}
              <QualityGateFactor
                label="ROIC vs WACC"
                score={qualityGate.roicWacc.score}
                max={25}
                details={[
                  {
                    label: 'Spread',
                    value: `${qualityGate.roicWacc.spreadBps >= 0 ? '+' : ''}${qualityGate.roicWacc.spreadBps} bps`,
                  },
                ]}
              />

              {/* Gross Margin */}
              <QualityGateFactor
                label="Gross Margin"
                score={qualityGate.grossMargin.score}
                max={25}
                details={[
                  {
                    label: 'Level',
                    value: `${(qualityGate.grossMargin.level * 100).toFixed(1)}%`,
                  },
                  {
                    label: 'Trend',
                    value:
                      qualityGate.grossMargin.trend > 0
                        ? `+${(qualityGate.grossMargin.trend * 100).toFixed(1)}pp`
                        : `${(qualityGate.grossMargin.trend * 100).toFixed(1)}pp`,
                  },
                ]}
              />

              {/* Revenue Quality */}
              <QualityGateFactor
                label="Revenue Quality"
                score={qualityGate.revenueQuality.score}
                max={25}
                details={[
                  {
                    label: 'Growth Years',
                    value: `${qualityGate.revenueQuality.growthYears}`,
                  },
                  {
                    label: 'CAGR',
                    value: `${(qualityGate.revenueQuality.cagr * 100).toFixed(1)}%`,
                  },
                ]}
              />

              {/* Capital Allocation */}
              <QualityGateFactor
                label="Capital Allocation"
                score={qualityGate.capitalAllocation.score}
                max={25}
                details={[
                  {
                    label: 'FCF Consistency',
                    value: `${(qualityGate.capitalAllocation.fcfConsistency * 100).toFixed(0)}%`,
                  },
                  {
                    label: 'Div Safety',
                    value: `${(qualityGate.capitalAllocation.divSafety * 100).toFixed(1)}%`,
                  },
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── MoatHeat ── */}
      {moat && (
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '18px 20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              InsightInvest™ MoatHeat
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 20,
                  fontWeight: 800,
                  color:
                    moat.composite >= 65
                      ? 'var(--green)'
                      : moat.composite >= 50
                        ? 'var(--accent)'
                        : 'var(--red)',
                }}
              >
                {moat.composite}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background:
                    moat.composite >= 65
                      ? 'rgba(34,197,94,0.12)'
                      : moat.composite >= 50
                        ? 'rgba(14,165,233,0.12)'
                        : 'rgba(239,68,68,0.12)',
                  color:
                    moat.composite >= 65
                      ? '#166534'
                      : moat.composite >= 50
                        ? '#0c4a6e'
                        : '#991b1b',
                }}
              >
                {moat.rating}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
            }}
          >
            {moat.dimensions.map((d) => (
              <div
                key={d.label}
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg)',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--fg2)',
                    }}
                  >
                    {d.label}
                  </span>
                  <span
                    style={{ fontSize: 11, fontWeight: 700, color: d.color }}
                  >
                    {d.score}
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 6,
                    background: 'var(--border)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${d.score}%`,
                      height: '100%',
                      background: d.color,
                      borderRadius: 3,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--muted)',
                    marginTop: 4,
                  }}
                >
                  {d.verdict}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

// ── Local helpers ────────────────────────────────────────────────────────────

function QualityGateFactor({
  label,
  score,
  max,
  details,
}: {
  label: string
  score: number
  max: number
  details: { label: string; value: string }[]
}) {
  const pct = (score / max) * 100
  const color =
    score >= max * 0.72 ? '#22c55e' : score >= max * 0.48 ? '#f59e0b' : '#ef4444'
  const bg =
    score >= max * 0.72
      ? 'rgba(34,197,94,0.08)'
      : score >= max * 0.48
        ? 'rgba(245,158,11,0.08)'
        : 'rgba(239,68,68,0.08)'

  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: 6,
        border: '1px solid var(--border)',
        background: bg,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <span
          style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg2)' }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 13,
            fontWeight: 800,
            color,
          }}
        >
          {Math.round(score)}/{max}
        </span>
      </div>

      <div
        style={{
          width: '100%',
          height: 5,
          background: 'var(--border)',
          borderRadius: 3,
          overflow: 'hidden',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 3,
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px 12px',
        }}
      >
        {details.map((d) => (
          <span key={d.label} style={{ fontSize: 10, color: 'var(--muted)' }}>
            {d.label}:{' '}
            <span
              style={{
                fontFamily: 'var(--mono)',
                fontWeight: 600,
                color: 'var(--fg2)',
              }}
            >
              {d.value}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span style={{ fontSize: 12, color: 'var(--fg2)' }}>{label}</span>
      <span
        style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600 }}
      >
        {value}
      </span>
    </div>
  )
}

function fmtMoney(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T'
  if (abs >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B'
  if (abs >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M'
  if (abs >= 1e3) return '$' + (n / 1e3).toFixed(2) + 'K'
  return '$' + n.toFixed(2)
}
