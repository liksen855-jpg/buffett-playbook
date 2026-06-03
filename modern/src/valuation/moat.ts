/**
 * InsightInvest™ MoatHeat — 6-Dimension Scoring System
 * Ported from stock-details.html computeSixDimensions()
 */

import type { IncomeStatement, BalanceSheet, CashFlowStatement, KeyMetrics } from '../api/types';

export interface DimensionResult {
  score: number;
  label: string;
  verdict: string;
  color: string;
}

export interface MoatHeatOutput {
  dimensions: DimensionResult[];
  composite: number;
  rating: string;
}

// ── Helpers ──
function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function cagr(start: number, end: number, years: number): number {
  if (start <= 0 || end <= 0 || years <= 0) return 0;
  return Math.pow(end / start, 1 / years) - 1;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

// ── Quality Gate (Business Quality) — 4 Sub-factors ──
export interface QualityGateInput {
  income: IncomeStatement[];
  balance: BalanceSheet[];
  cashflow: CashFlowStatement[];
  metrics: KeyMetrics[];
  beta?: number;
}

export interface QualityGateOutput {
  roicWacc: { score: number; spreadBps: number };
  grossMargin: { score: number; level: number; trend: number };
  revenueQuality: { score: number; growthYears: number; cagr: number };
  capitalAllocation: { score: number; buybackYield: number; divSafety: number; fcfConsistency: number };
  total: number;
  passed: boolean;
}

export function computeBusinessQuality(input: QualityGateInput): QualityGateOutput {
  const { income, cashflow, metrics, beta } = input;

  // ROIC vs WACC (max 25)
  const wacc = 0.045 + (beta ?? 1) * 0.055;
  const roic = metrics[0]?.roic ?? 0;
  const spread = roic - wacc;
  const spreadBps = Math.round(spread * 10000);
  const roicScore = clamp(
    spread > 0 ? 10 + spread * 100 : spread * 50,
    0, 25
  );

  // Gross Margin (max 25)
  const gmVals = income
    .slice(0, 5)
    .map(d => {
      if (!d.revenue || d.revenue === 0) return null;
      return (d.grossProfit ?? 0) / d.revenue;
    })
    .filter((v): v is number => v !== null);
  const gmLevel = avg(gmVals);
  const gmTrend = gmVals.length >= 2 ? gmVals[0] - gmVals[gmVals.length - 1] : 0;
  const gmScore = clamp(
    (gmLevel * 40) + (gmTrend > 0 ? 10 : gmTrend < 0 ? -5 : 0),
    0, 25
  );

  // Revenue Quality (max 25)
  const revs = income
    .map(d => d.revenue)
    .filter((v): v is number => typeof v === 'number' && isFinite(v))
    .reverse();
  const growthYears = revs.length >= 2
    ? revs.slice(1).filter((v, i) => v > revs[i]).length
    : 0;
  const revCAGR = revs.length >= 2 ? cagr(revs[0], revs[revs.length - 1], revs.length - 1) : 0;
  const revScore = clamp(
    (growthYears / Math.max(revs.length - 1, 1)) * 15 + revCAGR * 40,
    0, 25
  );

  // Capital Allocation (max 25)
  const buybackYield = metrics[0]?.payoutRatio ?? 0;
  const divSafety = metrics[0]?.dividendYield ?? 0;
  const fcfVals = cashflow
    .slice(0, 5)
    .map(d => d.freeCashFlow)
    .filter((v): v is number => typeof v === 'number' && isFinite(v));
  const fcfConsistency = fcfVals.length > 0
    ? fcfVals.filter(v => v > 0).length / fcfVals.length
    : 0;
  const capScore = clamp(
    buybackYield * 20 + divSafety * 40 + fcfConsistency * 10,
    0, 25
  );

  const total = roicScore + gmScore + revScore + capScore;

  return {
    roicWacc: { score: roicScore, spreadBps },
    grossMargin: { score: gmScore, level: gmLevel, trend: gmTrend },
    revenueQuality: { score: revScore, growthYears, cagr: revCAGR },
    capitalAllocation: { score: capScore, buybackYield, divSafety, fcfConsistency },
    total,
    passed: total >= 60,
  };
}

// ── 6 Dimensions ──
export interface MoatInput {
  profile?: { sector?: string | null } | null;
  quote?: { price?: number | null } | null;
  income: IncomeStatement[];
  balance: BalanceSheet[];
  cashflow: CashFlowStatement[];
  metrics: KeyMetrics[];
  earnings?: Array<{ estimatedEPS?: number | null; eps?: number | null }>;
  fairValue?: number | null;
  beta?: number;
}

export function computeSixDimensions(input: MoatInput): MoatHeatOutput {
  const { income, balance, cashflow, metrics, earnings, fairValue, beta, quote } = input;
  const price = quote?.price ?? 0;

  const dimensions: DimensionResult[] = [];

  // ── 1. Predictability ──
  const niVals = income.slice(0, 5).map(d => d.netIncome ?? 0);
  const posNI = niVals.filter(v => v > 0).length;
  const niScore = (posNI / Math.max(niVals.length, 1)) * 25;

  const revs = income.slice(0, 5).map(d => d.revenue ?? 0).reverse();
  const revGrowths = revs.slice(1).map((v, i) => revs[i] > 0 ? (v - revs[i]) / revs[i] : 0);
  const revCons = revGrowths.length > 0
    ? 25 - Math.min(avg(revGrowths.map(g => Math.abs(g - avg(revGrowths)))) * 500, 25)
    : 0;

  const epsBeats = (earnings ?? []).slice(0, 8).filter(e => {
    if (!e.estimatedEPS || !e.eps) return false;
    return e.eps > e.estimatedEPS;
  }).length;
  const epsBeatScore = Math.min((epsBeats / Math.max((earnings ?? []).length, 1)) * 25, 25);

  const omVals = income.slice(0, 5).map(d =>
    d.revenue && d.revenue !== 0 ? (d.operatingIncome ?? 0) / d.revenue : 0
  );
  const omStab = omVals.length > 0
    ? 25 - Math.min(avg(omVals.map(g => Math.abs(g - avg(omVals)))) * 400, 25)
    : 0;

  const predScore = clamp(niScore + revCons + epsBeatScore + omStab, 0, 100);
  dimensions.push({
    score: Math.round(predScore),
    label: 'Predictability',
    verdict: predScore >= 75 ? 'High' : predScore >= 50 ? 'Moderate' : 'Low',
    color: predScore >= 75 ? '#22c55e' : predScore >= 50 ? '#f59e0b' : '#ef4444',
  });

  // ── 2. Profitability ──
  // Compute margins from income statement since KeyMetrics doesn't have margin fields
  const rev0 = income[0]?.revenue ?? 0;
  const gm = rev0 !== 0 ? (income[0]?.grossProfit ?? 0) / rev0 : 0;
  const om = rev0 !== 0 ? (income[0]?.operatingIncome ?? 0) / rev0 : 0;
  const nm = rev0 !== 0 ? (income[0]?.netIncome ?? 0) / rev0 : 0;
  const roe = metrics[0]?.roe ?? 0;
  const fcfYield = metrics[0]?.freeCashFlowPerShare && quote?.price
    ? metrics[0].freeCashFlowPerShare / quote.price
    : 0;

  const profScore = clamp(
    gm * 40 + om * 40 + nm * 40 + roe * 30 + fcfYield * 200,
    0, 100
  );
  dimensions.push({
    score: Math.round(profScore),
    label: 'Profitability',
    verdict: profScore >= 75 ? 'Excellent' : profScore >= 50 ? 'Good' : 'Weak',
    color: profScore >= 75 ? '#22c55e' : profScore >= 50 ? '#f59e0b' : '#ef4444',
  });

  // ── 3. Growth Quality ──
  const rev3Y = income.slice(0, 3).map(d => d.revenue).filter((v): v is number => v !== undefined);
  const revCAGR3 = rev3Y.length >= 2 ? cagr(rev3Y[rev3Y.length - 1], rev3Y[0], rev3Y.length - 1) : 0;

  const eps3Y = income.slice(0, 3).map(d => d.epsdiluted ?? d.eps).filter((v): v is number => v !== undefined);
  const epsCAGR3 = eps3Y.length >= 2 ? cagr(eps3Y[eps3Y.length - 1], eps3Y[0], eps3Y.length - 1) : 0;

  const fcfVals = cashflow.slice(0, 5).map(d => d.freeCashFlow).filter((v): v is number => v !== undefined);
  const fcfGrowthCons = fcfVals.length > 0
    ? fcfVals.slice(1).filter((v, i) => v > fcfVals[i]).length / (fcfVals.length - 1)
    : 0;

  const firstRev = income[0]?.revenue;
  const lastRev = income[income.length - 1]?.revenue;
  const gmTrend = income.length >= 2 && firstRev && lastRev && firstRev !== 0 && lastRev !== 0
    ? ((income[0]?.grossProfit ?? 0) / firstRev) - ((income[income.length - 1]?.grossProfit ?? 0) / lastRev)
    : 0;

  const growthScore = clamp(
    revCAGR3 * 80 + epsCAGR3 * 80 + fcfGrowthCons * 25 + (gmTrend > 0 ? 15 : gmTrend < 0 ? -10 : 0),
    0, 100
  );
  dimensions.push({
    score: Math.round(growthScore),
    label: 'Growth Quality',
    verdict: growthScore >= 75 ? 'Strong' : growthScore >= 50 ? 'Steady' : 'Sluggish',
    color: growthScore >= 75 ? '#22c55e' : growthScore >= 50 ? '#f59e0b' : '#ef4444',
  });

  // ── 4. Economic Moat ──
  const roic = metrics[0]?.roic ?? 0;
  const nmCons = income.slice(0, 5).map(d =>
    d.revenue && d.revenue !== 0 ? (d.netIncome ?? 0) / d.revenue : 0
  );
  const nmStability = nmCons.length > 0
    ? 1 - avg(nmCons.map(g => Math.abs(g - avg(nmCons))))
    : 0;

  const lastRev2 = income[income.length - 1]?.revenue;
  const firstRev2 = income[0]?.revenue;
  const revGrowthPersist = income.length >= 2 && lastRev2 && lastRev2 !== 0 && firstRev2 && firstRev2 > lastRev2
    ? 1
    : 0;

  const qualityGate = computeBusinessQuality({ income, balance, cashflow, metrics, beta });

  const moatScore = clamp(
    gm * 30 + (roic > 0 ? roic * 30 : (metrics[0]?.roe ?? 0) * 20) + nmStability * 20 + revGrowthPersist * 10 + qualityGate.total * 0.2,
    0, 100
  );
  dimensions.push({
    score: Math.round(moatScore),
    label: 'Economic Moat',
    verdict: moatScore >= 75 ? 'Wide' : moatScore >= 50 ? 'Narrow' : 'None',
    color: moatScore >= 75 ? '#22c55e' : moatScore >= 50 ? '#f59e0b' : '#ef4444',
  });

  // ── 5. Financial Strength ──
  const currentRatio = balance[0]?.totalCurrentAssets && balance[0]?.totalCurrentLiabilities
    ? balance[0].totalCurrentAssets / balance[0].totalCurrentLiabilities
    : 0;
  const de = balance[0]?.totalStockholdersEquity && balance[0].totalStockholdersEquity !== 0
    ? (balance[0].totalDebt ?? 0) / balance[0].totalStockholdersEquity
    : 0;
  const firstBalance = balance[0];
  const firstBalanceDebt = firstBalance?.totalDebt ?? 0;
  const ic = income[0]?.operatingIncome && firstBalance && firstBalanceDebt > 0
    ? income[0].operatingIncome / firstBalanceDebt
    : 0;
  const posOcf = cashflow.slice(0, 5).filter(d => (d.operatingCashFlow ?? 0) > 0).length;
  const ocfScore = (posOcf / Math.max(cashflow.slice(0, 5).length, 1)) * 20;

  // Piotroski F-Score (simplified)
  const b0 = balance[0];
  const roa0 = b0?.totalAssets && b0.totalAssets !== 0
    ? (income[0]?.netIncome ?? 0) / b0.totalAssets
    : 0;
  const gpm0 = income[0]?.revenue && income[0].revenue !== 0
    ? (income[0]?.grossProfit ?? 0) / income[0].revenue
    : 0;
  const gpm1 = income[1]?.revenue && income[1].revenue !== 0
    ? (income[1]?.grossProfit ?? 0) / income[1].revenue
    : 0;
  const piotroski = [
    (income[0]?.netIncome ?? 0) > 0,
    (cashflow[0]?.operatingCashFlow ?? 0) > 0,
    roa0 > 0,
    (cashflow[0]?.operatingCashFlow ?? 0) > (income[0]?.netIncome ?? 0),
    gpm0 > gpm1,
    // Asset turnover: revenue / total assets (computed since not on KeyMetrics)
    (rev0 !== 0 && balance[0]?.totalAssets ? rev0 / balance[0].totalAssets : 0) >
    ((income[1]?.revenue ?? 0) !== 0 && balance[1]?.totalAssets ? (income[1].revenue ?? 0) / balance[1].totalAssets : 0),
  ].filter(Boolean).length;

  const isBank = (input.profile?.sector ?? '').includes('Financial');
  let finScore: number;
  if (isBank) {
    finScore = clamp(
      (de < 1 ? 20 : de < 2 ? 10 : 0) + (metrics[0]?.roe ?? 0) * 20 + ocfScore + piotroski * 3,
      0, 100
    );
  } else {
    finScore = clamp(
      Math.min(currentRatio * 10, 20) + (de < 0.5 ? 20 : de < 1 ? 15 : de < 2 ? 10 : 0) +
      Math.min(ic * 5, 20) + ocfScore + piotroski * 3,
      0, 100
    );
  }

  dimensions.push({
    score: Math.round(finScore),
    label: 'Financial Strength',
    verdict: finScore >= 75 ? 'Fortress' : finScore >= 50 ? 'Solid' : 'Fragile',
    color: finScore >= 75 ? '#22c55e' : finScore >= 50 ? '#f59e0b' : '#ef4444',
  });

  // ── 6. Valuation ──
  let valScore = 50;
  if (fairValue !== null && fairValue !== undefined && price > 0) {
    const upside = (fairValue - price) / price;
    valScore = clamp(Math.round(50 + upside * 100), 0, 100);
  }
  dimensions.push({
    score: valScore,
    label: 'Valuation',
    verdict: valScore >= 70 ? 'Undervalued' : valScore >= 50 ? 'Fair' : 'Overvalued',
    color: valScore >= 70 ? '#22c55e' : valScore >= 50 ? '#f59e0b' : '#ef4444',
  });

  // ── Composite ──
  const composite = avg(dimensions.map(d => d.score));
  const rating = composite >= 80 ? 'Exceptional'
    : composite >= 65 ? 'Strong'
    : composite >= 50 ? 'Good'
    : composite >= 35 ? 'Fair'
    : 'Weak';

  return { dimensions, composite: Math.round(composite), rating };
}
