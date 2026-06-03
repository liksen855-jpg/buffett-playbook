/**
 * ADR / Foreign-listed currency normalization
 *
 * FMP reports financial STATEMENTS in the company's reporting currency
 * (e.g. TWD for TSM) while price / market cap / shares are already in the
 * listing currency on an ADR-equivalent basis. Without this, every per-share
 * intrinsic value mixes a foreign numerator against a USD price → grossly inflated.
 *
 * Ported from stock-details.html lines 2212–2276
 */

import { fmpFetch } from '../api/fmp-client';
import { z } from 'zod';

export interface CurrencyNormalizationResult {
  applied: boolean;
  rate: number;
  from: string | null;
  to: string;
  note?: string;
}

// Keys that should NEVER be converted (ratios, identifiers, dates, share counts)
const NON_MONEY_KEYS = new Set([
  'calendarYear', 'fiscalYear', 'period', 'reportedCurrency', 'symbol', 'cik', 'date',
  'fillingDate', 'filingDate', 'acceptedDate', 'link', 'finalLink',
  'weightedAverageShsOut', 'weightedAverageShsOutDil',
  'grossProfitRatio', 'netIncomeRatio', 'operatingIncomeRatio', 'ebitdaratio',
]);

// key-metrics is mostly unitless ratios; convert ONLY these money fields
const METRIC_MONEY_KEYS = [
  'marketCap', 'enterpriseValue', 'workingCapital', 'investedCapital',
  'tangibleAssetValue', 'netCurrentAssetValue', 'averageReceivables',
  'averagePayables', 'averageInventory', 'revenuePerShare', 'netIncomePerShare',
  'operatingCashFlowPerShare', 'freeCashFlowPerShare', 'cashPerShare',
  'bookValuePerShare', 'tangibleBookValuePerShare', 'shareholdersEquityPerShare',
  'interestDebtPerShare', 'capexPerShare', 'grahamNumber', 'grahamNetNet',
];

/** Convert all numeric fields except excluded keys */
export function convertMoneyDeny<T extends Record<string, unknown>>(obj: T, rate: number): void {
  if (!obj) return;
  for (const k in obj) {
    if (NON_MONEY_KEYS.has(k)) continue;
    const v = obj[k];
    if (typeof v === 'number' && isFinite(v)) {
      (obj as Record<string, unknown>)[k] = v * rate;
    }
  }
}

/** Convert only explicitly allowed money fields */
export function convertMoneyAllow<T extends Record<string, unknown>>(obj: T, rate: number): void {
  if (!obj) return;
  METRIC_MONEY_KEYS.forEach(k => {
    const v = obj[k];
    if (typeof v === 'number' && isFinite(v)) {
      (obj as Record<string, unknown>)[k] = v * rate;
    }
  });
}

/** Fetch FX rate between two currencies using FMP quote endpoint */
const FxQuoteSchema = z.array(z.object({
  symbol: z.string(),
  price: z.number().nullable(),
}));

export async function getFxRate(from: string, to: string): Promise<number | null> {
  if (!from || !to || from === to) return 1;
  try {
    const r = await fmpFetch(`/quote?symbol=${from}${to}`, FxQuoteSchema);
    const p = r[0]?.price ?? null;
    if (typeof p === 'number' && p > 0) return p;
  } catch {
    // fall through
  }
  try {
    const r = await fmpFetch(`/quote?symbol=${to}${from}`, FxQuoteSchema);
    const p = r[0]?.price ?? null;
    if (typeof p === 'number' && p > 0) return 1 / p;
  } catch {
    // fall through
  }
  return null;
}

/** Input data shape for normalization */
export interface NormalizeInput {
  profile?: { currency?: string } | null;
  income?: Array<Record<string, unknown>> | null;
  incomeQ?: Array<Record<string, unknown>> | null;
  balance?: Array<Record<string, unknown>> | null;
  balanceQ?: Array<Record<string, unknown>> | null;
  cashflow?: Array<Record<string, unknown>> | null;
  cashflowQ?: Array<Record<string, unknown>> | null;
  metrics?: Array<Record<string, unknown>> | null;
}

/** Output with mutated arrays + metadata */
export interface NormalizeOutput {
  result: CurrencyNormalizationResult;
  priceCurrency: string;
  reportedCurrency: string;
}

/**
 * Normalize financial data from reporting currency to price currency.
 * Mutates the input arrays in place.
 */
export async function normalizeCurrency(data: NormalizeInput): Promise<NormalizeOutput> {
  const priceCcy = (data.profile?.currency ?? 'USD').toUpperCase();
  const repCcy = (
    (data.income?.[0] as { reportedCurrency?: string })?.reportedCurrency
    ?? (data.cashflow?.[0] as { reportedCurrency?: string })?.reportedCurrency
    ?? (data.balance?.[0] as { reportedCurrency?: string })?.reportedCurrency
    ?? priceCcy
  ).toUpperCase();

  const result: CurrencyNormalizationResult = {
    applied: false,
    rate: 1,
    from: null,
    to: priceCcy,
  };

  if (!repCcy || repCcy === priceCcy) {
    return { result, priceCurrency: priceCcy, reportedCurrency: repCcy };
  }

  const rate = await getFxRate(repCcy, priceCcy);
  if (!rate || !isFinite(rate) || rate <= 0) {
    result.note = `FX ${repCcy}->${priceCcy} unavailable`;
    return { result, priceCurrency: priceCcy, reportedCurrency: repCcy };
  }

  result.applied = true;
  result.rate = rate;
  result.from = repCcy;

  const arrays = [
    data.income, data.incomeQ,
    data.balance, data.balanceQ,
    data.cashflow, data.cashflowQ,
  ];

  arrays.forEach(arr => {
    if (!arr) return;
    arr.forEach(d => convertMoneyDeny(d, rate));
  });

  (data.metrics ?? []).forEach(m => convertMoneyAllow(m, rate));

  return { result, priceCurrency: priceCcy, reportedCurrency: repCcy };
}

/** Build a subtitle string explaining currency state */
export function buildCurrencySubtitle(
  priceCurrency: string,
  fx: CurrencyNormalizationResult,
  reportedCurrency: string
): string {
  let txt = `All numbers are in ${priceCurrency} millions, except per-share data, ratios, and percentages.`;
  if (fx.applied && fx.from) {
    txt += ` Converted from ${fx.from} at ${fx.from}${fx.to} ${Number(fx.rate).toPrecision(4)}.`;
  } else if (fx.note) {
    txt += ` (${fx.note} — figures remain in ${reportedCurrency})`;
  }
  return txt;
}
