/**
 * Intrinsic Valuation Engine
 * 10 valuation methods + trimmed-mean composite
 * Ported from stock-details.html
 */

import type { IncomeStatement, BalanceSheet, CashFlowStatement, KeyMetrics } from '../api/types';

// ── Sector median multiples (hardcoded from stock-details.html) ──
export const SECTOR_MEDIANS: Record<string, { pe?: number; ps?: number; pb?: number; evEbitda?: number; evRev?: number }> = {
  'Technology': { pe: 28, ps: 6, pb: 5, evEbitda: 18, evRev: 5 },
  'Communication Services': { pe: 18, ps: 1.8, pb: 2.5, evEbitda: 10, evRev: 2 },
  'Consumer Cyclical': { pe: 20, ps: 1.2, pb: 3, evEbitda: 10, evRev: 1 },
  'Consumer Defensive': { pe: 22, ps: 2, pb: 4, evEbitda: 14, evRev: 2 },
  'Energy': { pe: 12, ps: 1.2, pb: 1.5, evEbitda: 6, evRev: 1.5 },
  'Financial Services': { pe: 14, ps: 3, pb: 1.2, evEbitda: 10, evRev: 3 },
  'Healthcare': { pe: 22, ps: 3, pb: 3.5, evEbitda: 14, evRev: 3 },
  'Industrials': { pe: 20, ps: 1.8, pb: 3, evEbitda: 12, evRev: 1.5 },
  'Basic Materials': { pe: 16, ps: 1.2, pb: 1.8, evEbitda: 8, evRev: 1.2 },
  'Real Estate': { pe: 18, ps: 8, pb: 1.5, evEbitda: 16, evRev: 8 },
  'Utilities': { pe: 18, ps: 2, pb: 1.5, evEbitda: 10, evRev: 2 },
};

// ── Helpers ──
function avg(arr: number[]): number | null {
  if (!arr.length) return null;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function avgKey<T>(arr: T[], key: keyof T, n?: number): number | null {
  const vals = arr
    .slice(0, n ?? arr.length)
    .map(d => d[key] as number | null | undefined)
    .filter((v): v is number => typeof v === 'number' && isFinite(v));
  return avg(vals);
}

function cagr(start: number, end: number, years: number): number {
  if (start <= 0 || end <= 0 || years <= 0) return 0;
  return Math.pow(end / start, 1 / years) - 1;
}

function computeRevenueCAGR(income: IncomeStatement[]): number {
  const revs = income
    .map(d => d.revenue)
    .filter((v): v is number => typeof v === 'number' && isFinite(v))
    .reverse();
  if (revs.length < 2) return 0.04;
  const g = cagr(revs[0], revs[revs.length - 1], revs.length - 1);
  return Math.max(0.02, Math.min(0.30, g));
}

export function computeWACC(beta: number): number {
  const rf = 0.045;
  const erp = 0.055;
  return rf + beta * erp;
}

// ── DCF Formulas ──
export function dcfConstantGrowth(baseFcf: number, g: number, wacc: number, tg: number, years = 10): number | null {
  if (wacc <= tg) return null;
  let pv = 0;
  let fcf = baseFcf;
  for (let y = 1; y <= years; y++) {
    fcf = fcf * (1 + g);
    pv += fcf / Math.pow(1 + wacc, y);
  }
  const tv = (fcf * (1 + tg)) / (wacc - tg);
  pv += tv / Math.pow(1 + wacc, years);
  return pv;
}

export function dcfDeclining(baseFcf: number, g0: number, tg: number, wacc: number, years = 10): number | null {
  if (wacc <= tg) return null;
  let pv = 0;
  let fcf = baseFcf;
  for (let y = 1; y <= years; y++) {
    let g: number;
    if (y <= 3) g = g0;
    else {
      const t = (y - 3) / (years - 3);
      g = g0 + (tg - g0) * t;
    }
    fcf = fcf * (1 + g);
    pv += fcf / Math.pow(1 + wacc, y);
  }
  const tv = (fcf * (1 + tg)) / (wacc - tg);
  pv += tv / Math.pow(1 + wacc, years);
  return pv;
}

function threeStageDCF(base: number, g1: number, fade: number, terminal: number, wacc: number, years = 20): number | null {
  if (wacc <= terminal) return null;
  let pv = 0;
  let fcf = base;
  for (let y = 1; y <= years; y++) {
    let g: number;
    if (y <= 5) g = g1;
    else if (y <= 10) g = g1 * fade;
    else g = terminal;
    fcf = fcf * (1 + g);
    pv += fcf / Math.pow(1 + wacc, y);
  }
  const tv = (fcf * (1 + terminal)) / (wacc - terminal);
  pv += tv / Math.pow(1 + wacc, years);
  return pv;
}

// ── Input bundle ──
export interface ValuationInput {
  income: IncomeStatement[];
  balance: BalanceSheet[];
  cashflow: CashFlowStatement[];
  metrics: KeyMetrics[];
  price: number;
  shares: number;
  sector?: string;
  beta?: number;
  aaaYield?: number;
}

export interface ValuationResult {
  method: string;
  value: number | null;
}

export interface ValuationOutput {
  results: ValuationResult[];
  composite: number | null;
  upside: number | null;
}

// ── Main engine ──
export function runValuation(input: ValuationInput): ValuationOutput {
  const { income, balance, cashflow, price, shares, sector, beta, aaaYield } = input;

  if (!income.length || !shares || shares <= 0) {
    return { results: [], composite: null, upside: null };
  }

  const results: ValuationResult[] = [];

  const ttmIncome = income[0];
  const ttmBalance = balance[0] ?? {};
  const ttmCashflow = cashflow[0] ?? {};
  const revenue = ttmIncome.revenue ?? 0;
  const netIncome = ttmIncome.netIncome ?? 0;
  const operatingIncome = ttmIncome.operatingIncome ?? 0;
  const ebitda = ttmIncome.ebitda ?? 0;
  const eps = ttmIncome.epsdiluted ?? ttmIncome.eps ?? 0;

  const totalDebt = ttmBalance.totalDebt ?? 0;
  const cash = ttmBalance.cashAndCashEquivalents ?? ttmBalance.cashAndShortTermInvestments ?? 0;
  const mktCap = price * shares;

  const ocf = ttmCashflow.operatingCashFlow ?? 0;
  const fcf = ttmCashflow.freeCashFlow ?? 0;

  const growth = computeRevenueCAGR(income);
  const wacc = computeWACC(beta ?? 1);
  const sectorMed = SECTOR_MEDIANS[sector ?? ''] ?? {};

  // ── 1. DCF-20 (Operating CF) ──
  const dcf20 = threeStageDCF(ocf, growth, 0.70, 0.04, 0.08, 20);
  if (dcf20 !== null) {
    results.push({ method: 'DCF-20 (Operating CF)', value: (dcf20 - totalDebt + cash) / shares });
  }

  // ── 2. DFCF-20 (Free CF) ──
  const dfcf20 = threeStageDCF(fcf, growth, 0.70, 0.04, 0.08, 20);
  if (dfcf20 !== null) {
    results.push({ method: 'DFCF-20 (Free CF)', value: (dfcf20 - totalDebt + cash) / shares });
  }

  // ── 3. DNI-20 (Net Income) ──
  const dni20 = threeStageDCF(netIncome, growth, 0.70, 0.04, 0.08, 20);
  if (dni20 !== null) {
    results.push({ method: 'DNI-20 (Net Income)', value: (dni20 - totalDebt + cash) / shares });
  }

  // ── 4. H-Model DCF ──
  const gt = 0.04;
  const gr0 = growth;
  const H = 4;
  if (wacc > gt && fcf > 0) {
    const hValue = (fcf * (1 + gt)) / (wacc - gt) + (fcf * H * (gr0 - gt)) / (wacc - gt);
    results.push({ method: 'H-Model DCF', value: (hValue - totalDebt + cash) / shares });
  }

  // ── 5. EV / EBITDA ──
  const evEbitdaMult = (sectorMed.evEbitda ?? 12) * 0.6 + 12 * 0.4;
  const fwdEbitda = ebitda * (1 + growth);
  if (fwdEbitda > 0) {
    results.push({ method: 'EV / EBITDA', value: (evEbitdaMult * fwdEbitda - totalDebt + cash) / shares });
  }

  // ── 6. EV / Revenue ──
  const evRevMult = Math.min((sectorMed.evRev ?? 3) * 0.6 + 3 * 0.4, 5.5);
  if (revenue > 0) {
    results.push({ method: 'EV / Revenue', value: (evRevMult * revenue * (1 + growth) - totalDebt + cash) / shares });
  }

  // ── 7. P / FCF ──
  const pFcfHist = mktCap > 0 && fcf > 0 ? mktCap / fcf : 0;
  const pFcfMult = pFcfHist > 0 ? Math.min(pFcfHist, 50) : (sectorMed.pe ?? 20);
  if (fcf > 0) {
    results.push({ method: 'P / FCF', value: (pFcfMult * fcf) / shares });
  }

  // ── 8. Revenue DCF ──
  const opMargin = Math.max(0.05, operatingIncome > 0 && revenue > 0 ? operatingIncome / revenue : 0.05);
  const fcfConv = opMargin * 0.70;
  const termMult = Math.min((sectorMed.evRev ?? 3) * 1.5, 8);
  let revDcf = 0;
  let rev = revenue;
  for (let y = 1; y <= 10; y++) {
    const g = y <= 3 ? growth : growth * Math.pow(0.7, y - 3);
    rev = rev * (1 + g);
    revDcf += (rev * fcfConv) / Math.pow(1 + wacc, y);
  }
  const tvRev = (rev * fcfConv * termMult) / Math.pow(1 + wacc, 10);
  revDcf += tvRev;
  results.push({ method: 'Revenue DCF', value: (revDcf - totalDebt + cash) / shares });

  // ── 9. PEG-implied ──
  const fairPE = 1.5 * (growth * 100);
  const fwdEPS = eps * Math.pow(1 + growth, 3);
  if (fwdEPS > 0) {
    results.push({ method: 'PEG-implied', value: fairPE * fwdEPS });
  }

  // ── 10. Graham Revised ──
  const Y = aaaYield ?? 0.05;
  const grahamGrowth = growth * 100;
  if (eps > 0 && Y > 0) {
    const grahamValue = eps * (8.5 + 2 * grahamGrowth) * (4.4 / (Y * 100));
    results.push({ method: 'Graham Revised', value: grahamValue });
  }

  // ── Composite (trimmed mean) ──
  const valid = results
    .filter(r => r.value !== null && isFinite(r.value) && r.value > 0)
    .map(r => r.value as number)
    .sort((a, b) => a - b);

  let composite: number | null = null;
  if (valid.length >= 4) {
    const t = valid.slice(1, -1);
    composite = t.reduce((s, v) => s + v, 0) / t.length;
  } else if (valid.length > 0) {
    composite = valid.reduce((s, v) => s + v, 0) / valid.length;
  }

  const upside = composite !== null && price > 0 ? (composite - price) / price : null;

  return { results, composite, upside };
}

// ── EPV (Earnings Power Value) ──
export function computeEPV(input: ValuationInput) {
  const { income, shares, beta } = input;
  if (!income.length || !shares) return null;

  const wacc = computeWACC(beta ?? 1);
  const avgEbit = avgKey(income, 'operatingIncome', 3) ?? 0;

  // 3Y effective tax rate average
  const taxRates = income
    .slice(0, 3)
    .map(d => {
      if (!d.incomeTaxExpense || !d.incomeBeforeTax) return null;
      return Math.abs(d.incomeTaxExpense / d.incomeBeforeTax);
    })
    .filter((v): v is number => v !== null);
  const taxRate = avg(taxRates) ?? 0.21;

  const nopat = avgEbit * (1 - taxRate);
  const epv = wacc > 0 ? nopat / wacc : 0;

  return {
    wacc,
    avgEbit,
    taxRate,
    nopat,
    epv,
    epvPerShare: epv / shares,
  };
}

// ── Owner Earnings Yield ──
export function computeOwnerEarningsYield(input: ValuationInput) {
  const { income, cashflow, price, shares } = input;
  if (!income.length || !cashflow.length || !price || !shares) return null;

  const ni = income[0].netIncome ?? 0;
  const da = cashflow[0].depreciationAndAmortization ?? 0;
  const capex = cashflow[0].capitalExpenditure ?? 0;
  const mktCap = price * shares;

  const maintCapex = Math.abs(capex) * 0.60;
  const oe = ni + da - maintCapex;
  const yld = mktCap > 0 ? oe / mktCap : 0;

  return { netIncome: ni, da, capex, maintCapex, ownerEarnings: oe, yield: yld };
}
