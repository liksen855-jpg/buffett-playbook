/**
 * Zod schemas for all Financial Modeling Prep API responses.
 *
 * These schemas enforce the exact shape of FMP data at runtime.
 * If FMP changes a field name or type, Zod throws a descriptive error
 * instead of letting `undefined` propagate into valuation math.
 */

import { z } from 'zod'

// ── Shared primitives ────────────────────────────────────────────────────────

export const NullableNumber = z.number().nullable().default(null)
export const OptionalNumber = z.number().optional()
export const NullableString = z.string().nullable().default(null)

// Money values in raw currency (not formatted)
export const Money = z.number().nullable()

// Percentages stored as decimals (e.g., 0.15 = 15%)
export const Decimal = z.number().nullable()

// ISO date strings from FMP
export const ISODate = z.string()

// ── 1. Company Profile ───────────────────────────────────────────────────────

export const CompanyProfileSchema = z.object({
  symbol: z.string(),
  companyName: z.string().nullable(),
  cik: z.string().nullable(),
  exchange: z.string().nullable(),
  exchangeShortName: z.string().nullable(),
  industry: z.string().nullable(),
  website: z.string().nullable(),
  description: z.string().nullable(),
  ceo: z.string().nullable(),
  sector: z.string().nullable(),
  country: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zip: z.string().nullable(),
  image: z.string().nullable(),
  ipoDate: z.string().nullable(),
  isEtf: z.boolean().nullable(),
  isActivelyTrading: z.boolean().nullable(),
  isAdr: z.boolean().nullable(),
  isFund: z.boolean().nullable(),
  // Pricing fallbacks (sometimes present in profile)
  price: z.number().nullable(),
  beta: z.number().nullable(),
  volAvg: z.number().nullable(),
  mktCap: z.number().nullable(),
  lastDiv: z.number().nullable(),
  range: z.string().nullable(), // e.g. "150.00-200.00"
  changes: z.number().nullable(),
  currency: z.string().nullable(),
  cusip: z.string().nullable(),
  isin: z.string().nullable(),
})

export type CompanyProfile = z.infer<typeof CompanyProfileSchema>

// ── 2. Quote ─────────────────────────────────────────────────────────────────

export const QuoteSchema = z.object({
  symbol: z.string(),
  name: z.string().nullable(),
  price: z.number().nullable(),
  changesPercentage: z.number().nullable(),
  change: z.number().nullable(),
  dayLow: z.number().nullable(),
  dayHigh: z.number().nullable(),
  yearHigh: z.number().nullable(),
  yearLow: z.number().nullable(),
  marketCap: z.number().nullable(),
  priceAvg50: z.number().nullable(),
  priceAvg200: z.number().nullable(),
  volume: z.number().nullable(),
  avgVolume: z.number().nullable(),
  exchange: z.string().nullable(),
  open: z.number().nullable(),
  previousClose: z.number().nullable(),
  eps: z.number().nullable(),
  pe: z.number().nullable(),
  earningsAnnouncement: z.string().nullable(),
  sharesOutstanding: z.number().nullable(),
  timestamp: z.number().nullable(),
})

export type Quote = z.infer<typeof QuoteSchema>

// ── 3. Income Statement ──────────────────────────────────────────────────────

export const IncomeStatementSchema = z.object({
  date: z.string(),
  symbol: z.string(),
  reportedCurrency: z.string().nullable().default('USD'),
  cik: z.string().nullable(),
  fillingDate: z.string().nullable(),
  acceptedDate: z.string().nullable(),
  calendarYear: z.string().nullable(),
  period: z.string().nullable(), // FY, Q1, Q2, Q3, Q4

  revenue: z.number().nullable(),
  costOfRevenue: z.number().nullable(),
  grossProfit: z.number().nullable(),
  grossProfitRatio: z.number().nullable(),

  researchAndDevelopmentExpenses: z.number().nullable(),
  generalAndAdministrativeExpenses: z.number().nullable(),
  sellingAndMarketingExpenses: z.number().nullable(),
  sellingGeneralAndAdministrativeExpenses: z.number().nullable(),
  otherExpenses: z.number().nullable(),
  operatingExpenses: z.number().nullable(),
  costAndExpenses: z.number().nullable(),
  interestIncome: z.number().nullable(),
  interestExpense: z.number().nullable(),
  depreciationAndAmortization: z.number().nullable(),
  ebitda: z.number().nullable(),
  ebitdaratio: z.number().nullable(),

  operatingIncome: z.number().nullable(),
  operatingIncomeRatio: z.number().nullable(),

  totalOtherIncomeExpensesNet: z.number().nullable(),
  incomeBeforeTax: z.number().nullable(),
  incomeBeforeTaxRatio: z.number().nullable(),

  incomeTaxExpense: z.number().nullable(),
  netIncome: z.number().nullable(),
  netIncomeRatio: z.number().nullable(),

  eps: z.number().nullable(),
  epsdiluted: z.number().nullable(),
  weightedAverageShsOut: z.number().nullable(),
  weightedAverageShsOutDil: z.number().nullable(),

  link: z.string().nullable(),
  finalLink: z.string().nullable(),
})

export type IncomeStatement = z.infer<typeof IncomeStatementSchema>

// ── 4. Balance Sheet ─────────────────────────────────────────────────────────

export const BalanceSheetSchema = z.object({
  date: z.string(),
  symbol: z.string(),
  reportedCurrency: z.string().nullable().default('USD'),
  cik: z.string().nullable(),
  fillingDate: z.string().nullable(),
  acceptedDate: z.string().nullable(),
  calendarYear: z.string().nullable(),
  period: z.string().nullable(),

  cashAndCashEquivalents: z.number().nullable(),
  shortTermInvestments: z.number().nullable(),
  cashAndShortTermInvestments: z.number().nullable(),
  netReceivables: z.number().nullable(),
  inventory: z.number().nullable(),
  otherCurrentAssets: z.number().nullable(),
  totalCurrentAssets: z.number().nullable(),

  propertyPlantEquipmentNet: z.number().nullable(),
  goodwill: z.number().nullable(),
  intangibleAssets: z.number().nullable(),
  goodwillAndIntangibleAssets: z.number().nullable(),
  longTermInvestments: z.number().nullable(),
  taxAssets: z.number().nullable(),
  otherNonCurrentAssets: z.number().nullable(),
  totalNonCurrentAssets: z.number().nullable(),
  totalAssets: z.number().nullable(),

  accountPayables: z.number().nullable(),
  shortTermDebt: z.number().nullable(),
  taxPayables: z.number().nullable(),
  deferredRevenue: z.number().nullable(),
  otherCurrentLiabilities: z.number().nullable(),
  totalCurrentLiabilities: z.number().nullable(),

  longTermDebt: z.number().nullable(),
  deferredRevenueNonCurrent: z.number().nullable(),
  deferredTaxLiabilitiesNonCurrent: z.number().nullable(),
  otherNonCurrentLiabilities: z.number().nullable(),
  totalNonCurrentLiabilities: z.number().nullable(),
  totalLiabilities: z.number().nullable(),

  commonStock: z.number().nullable(),
  retainedEarnings: z.number().nullable(),
  accumulatedOtherComprehensiveIncomeLoss: z.number().nullable(),
  othertotalStockholdersEquity: z.number().nullable(),
  totalStockholdersEquity: z.number().nullable(),
  totalLiabilitiesAndStockholdersEquity: z.number().nullable(),

  totalInvestments: z.number().nullable(),
  totalDebt: z.number().nullable(),
  netDebt: z.number().nullable(),

  link: z.string().nullable(),
  finalLink: z.string().nullable(),
})

export type BalanceSheet = z.infer<typeof BalanceSheetSchema>

// ── 5. Cash Flow Statement ───────────────────────────────────────────────────

export const CashFlowStatementSchema = z.object({
  date: z.string(),
  symbol: z.string(),
  reportedCurrency: z.string().nullable().default('USD'),
  cik: z.string().nullable(),
  fillingDate: z.string().nullable(),
  acceptedDate: z.string().nullable(),
  calendarYear: z.string().nullable(),
  period: z.string().nullable(),

  netIncome: z.number().nullable(),
  depreciationAndAmortization: z.number().nullable(),
  deferredIncomeTax: z.number().nullable(),
  stockBasedCompensation: z.number().nullable(),
  changeInWorkingCapital: z.number().nullable(),
  accountsReceivables: z.number().nullable(),
  inventory: z.number().nullable(),
  accountsPayables: z.number().nullable(),
  otherWorkingCapital: z.number().nullable(),
  otherNonCashItems: z.number().nullable(),

  netCashProvidedByOperatingActivities: z.number().nullable(),
  operatingCashFlow: z.number().nullable(),

  investmentsInPropertyPlantAndEquipment: z.number().nullable(),
  acquisitionsNet: z.number().nullable(),
  purchasesOfInvestments: z.number().nullable(),
  salesMaturitiesOfInvestments: z.number().nullable(),
  otherInvestingActivites: z.number().nullable(),
  netCashUsedForInvestingActivites: z.number().nullable(),

  debtRepayment: z.number().nullable(),
  commonStockIssued: z.number().nullable(),
  commonStockRepurchased: z.number().nullable(),
  dividendsPaid: z.number().nullable(),
  otherFinancingActivites: z.number().nullable(),
  netCashUsedProvidedByFinancingActivities: z.number().nullable(),

  effectOfForexChangesOnCash: z.number().nullable(),
  netChangeInCash: z.number().nullable(),
  cashAtEndOfPeriod: z.number().nullable(),
  cashAtBeginningOfPeriod: z.number().nullable(),

  capitalExpenditure: z.number().nullable(),
  freeCashFlow: z.number().nullable(),

  link: z.string().nullable(),
  finalLink: z.string().nullable(),
})

export type CashFlowStatement = z.infer<typeof CashFlowStatementSchema>

// ── 6. Key Metrics ───────────────────────────────────────────────────────────

export const KeyMetricsSchema = z.object({
  symbol: z.string(),
  date: z.string(),
  period: z.string().nullable(),
  calendarYear: z.string().nullable(),
  reportedCurrency: z.string().nullable().default('USD'),

  revenuePerShare: z.number().nullable(),
  netIncomePerShare: z.number().nullable(),
  operatingCashFlowPerShare: z.number().nullable(),
  freeCashFlowPerShare: z.number().nullable(),
  cashPerShare: z.number().nullable(),
  bookValuePerShare: z.number().nullable(),
  tangibleBookValuePerShare: z.number().nullable(),
  shareholdersEquityPerShare: z.number().nullable(),
  interestDebtPerShare: z.number().nullable(),
  marketCap: z.number().nullable(),

  peRatio: z.number().nullable(),
  priceToSalesRatio: z.number().nullable(),
  pocfratio: z.number().nullable(),
  pfcfRatio: z.number().nullable(),
  pbRatio: z.number().nullable(),
  ptbRatio: z.number().nullable(),

  evToSales: z.number().nullable(),
  enterpriseValueOverEBITDA: z.number().nullable(),
  evToOperatingCashFlow: z.number().nullable(),
  evToFreeCashFlow: z.number().nullable(),
  earningsYield: z.number().nullable(),
  freeCashFlowYield: z.number().nullable(),
  debtToEquity: z.number().nullable(),
  debtToAssets: z.number().nullable(),
  netDebtToEBITDA: z.number().nullable(),
  currentRatio: z.number().nullable(),
  interestCoverage: z.number().nullable(),
  incomeQuality: z.number().nullable(),

  dividendYield: z.number().nullable(),
  payoutRatio: z.number().nullable(),
  salesGeneralAndAdministrativeToRevenue: z.number().nullable(),
  researchAndDdevelopementToRevenue: z.number().nullable(),
  intangiblesToTotalAssets: z.number().nullable(),
  capexToOperatingCashFlow: z.number().nullable(),
  capexToRevenue: z.number().nullable(),
  capexToDepreciation: z.number().nullable(),
  stockBasedCompensationToRevenue: z.number().nullable(),
  grahmNumber: z.number().nullable(),
  roic: z.number().nullable(),
  returnOnTangibleAssets: z.number().nullable(),

  roe: z.number().nullable(),
  returnOnEquity: z.number().nullable(),
  returnOnAssets: z.number().nullable(),
  returnOnInvestedCapital: z.number().nullable(),

  grahamNetNet: z.number().nullable(),
  workingCapital: z.number().nullable(),
  tangibleAssetValue: z.number().nullable(),
  netCurrentAssetValue: z.number().nullable(),
  investedCapital: z.number().nullable(),
  averageReceivables: z.number().nullable(),
  averagePayables: z.number().nullable(),
  averageInventory: z.number().nullable(),
  daysSalesOutstanding: z.number().nullable(),
  daysPayablesOutstanding: z.number().nullable(),
  daysOfInventoryOnHand: z.number().nullable(),
  receivablesTurnover: z.number().nullable(),
  payablesTurnover: z.number().nullable(),
  inventoryTurnover: z.number().nullable(),
  roe5Y: z.number().nullable(),
  roa5Y: z.number().nullable(),
  roi5Y: z.number().nullable(),
  averageNetFixedAssets: z.number().nullable(),
  averageTotalAssets: z.number().nullable(),
  dividendPerShare: z.number().nullable(),
  payoutRatio5Y: z.number().nullable(),
  dividendYield5Y: z.number().nullable(),
})

export type KeyMetrics = z.infer<typeof KeyMetricsSchema>

// ── 7. Discounted Cash Flow (FMP's own model) ────────────────────────────────

export const DCFSchema = z.object({
  symbol: z.string(),
  date: z.string(),
  dcf: z.number().nullable(),
  stockPrice: z.number().nullable(),
  // Note: FMP DCF response shape varies by endpoint version
  // Some versions return an array, some an object
})

export type DCF = z.infer<typeof DCFSchema>

// ── 8. Historical Price (EOD) ────────────────────────────────────────────────

export const HistoricalPriceSchema = z.object({
  date: z.string(),
  open: z.number().nullable(),
  high: z.number().nullable(),
  low: z.number().nullable(),
  close: z.number().nullable(),
  adjClose: z.number().nullable(),
  volume: z.number().nullable(),
  unadjustedVolume: z.number().nullable(),
  change: z.number().nullable(),
  changePercent: z.number().nullable(),
  vwap: z.number().nullable(),
  label: z.string().nullable(),
  changeOverTime: z.number().nullable(),
})

export type HistoricalPrice = z.infer<typeof HistoricalPriceSchema>

// Light endpoint sometimes returns simplified shape
export const HistoricalPriceLightSchema = z.object({
  date: z.string(),
  price: z.number().nullable(),
  close: z.number().nullable(),
})

export type HistoricalPriceLight = z.infer<typeof HistoricalPriceLightSchema>

// ── 9. Earnings (surprise history) ───────────────────────────────────────────

export const EarningsSchema = z.object({
  symbol: z.string(),
  date: z.string(),
  eps: z.number().nullable(),
  epsEstimated: z.number().nullable(),
  time: z.string().nullable(), // bmo, amc
  revenue: z.number().nullable(),
  revenueEstimated: z.number().nullable(),
  fiscalDateEnding: z.string().nullable(),
  updatedFromDate: z.string().nullable(),
})

export type Earnings = z.infer<typeof EarningsSchema>

// ── 10. Earnings Calendar ────────────────────────────────────────────────────

export const EarningsCalendarSchema = z.object({
  symbol: z.string(),
  date: z.string(),
  epsEstimated: z.number().nullable(),
  revenueEstimated: z.number().nullable(),
  time: z.string().nullable(),
})

export type EarningsCalendar = z.infer<typeof EarningsCalendarSchema>

// ── 11. News ─────────────────────────────────────────────────────────────────

export const NewsItemSchema = z.object({
  symbol: z.string().nullable(),
  publishedDate: z.string().nullable(),
  title: z.string().nullable(),
  image: z.string().nullable(),
  site: z.string().nullable(),
  text: z.string().nullable(),
  url: z.string().nullable(),
  content: z.string().nullable(),
  publisher: z.string().nullable(),
  date: z.string().nullable(),
})

export type NewsItem = z.infer<typeof NewsItemSchema>

// ── 12. Screener Result ──────────────────────────────────────────────────────

export const ScreenerResultSchema = z.object({
  symbol: z.string(),
  companyName: z.string().nullable(),
  marketCap: z.number().nullable(),
  sector: z.string().nullable(),
  industry: z.string().nullable(),
  beta: z.number().nullable(),
  price: z.number().nullable(),
  volume: z.number().nullable(),
  lastAnnualDividend: z.number().nullable(),
  exchange: z.string().nullable(),
  isEtf: z.boolean().nullable(),
  isFund: z.boolean().nullable(),
  isActivelyTrading: z.boolean().nullable(),
})

export type ScreenerResult = z.infer<typeof ScreenerResultSchema>

// ── 13. Batch Quote (paid tier) ──────────────────────────────────────────────

export const BatchQuoteSchema = z.object({
  symbol: z.string(),
  price: z.number().nullable(),
  volume: z.number().nullable(),
  changePercentage: z.number().nullable(),
  changesPercentage: z.number().nullable(),
  change: z.number().nullable(),
  marketCap: z.number().nullable(),
})

export type BatchQuote = z.infer<typeof BatchQuoteSchema>

// ── 14. Biggest Gainers / Losers / Most Actives ──────────────────────────────

export const MoverSchema = z.object({
  symbol: z.string(),
  name: z.string().nullable(),
  companyName: z.string().nullable(),
  price: z.number().nullable(),
  change: z.number().nullable(),
  changesPercentage: z.number().nullable(),
  changePercentage: z.number().nullable(),
  marketCap: z.number().nullable(),
  volume: z.number().nullable(),
})

export type Mover = z.infer<typeof MoverSchema>

// ── 15. Analyst Estimates (paid tier) ────────────────────────────────────────

export const AnalystEstimateSchema = z.object({
  symbol: z.string(),
  date: z.string(),
  estimatedRevenueLow: z.number().nullable(),
  estimatedRevenueHigh: z.number().nullable(),
  estimatedRevenueAvg: z.number().nullable(),
  estimatedEpsLow: z.number().nullable(),
  estimatedEpsHigh: z.number().nullable(),
  estimatedEpsAvg: z.number().nullable(),
  numberAnalystsEstimatedRevenue: z.number().nullable(),
  numberAnalystsEstimatedEps: z.number().nullable(),
})

export type AnalystEstimate = z.infer<typeof AnalystEstimateSchema>

// ── 16. Insider Trading (paid tier) ──────────────────────────────────────────

export const InsiderTradeSchema = z.object({
  symbol: z.string(),
  filingDate: z.string().nullable(),
  transactionDate: z.string().nullable(),
  reportingName: z.string().nullable(),
  transactionType: z.string().nullable(),
  securitiesTransacted: z.number().nullable(),
  price: z.number().nullable(),
  securityName: z.string().nullable(),
})

export type InsiderTrade = z.infer<typeof InsiderTradeSchema>

// ── 17. Institutional Ownership (paid tier) ──────────────────────────────────

export const InstitutionalHolderSchema = z.object({
  holder: z.string().nullable(),
  shares: z.number().nullable(),
  dateReported: z.string().nullable(),
  change: z.number().nullable(),
  weightPercent: z.number().nullable(),
})

export type InstitutionalHolder = z.infer<typeof InstitutionalHolderSchema>

// ── Array wrappers ───────────────────────────────────────────────────────────

export const CompanyProfileArraySchema = z.array(CompanyProfileSchema)
export const QuoteArraySchema = z.array(QuoteSchema)
export const IncomeStatementArraySchema = z.array(IncomeStatementSchema)
export const BalanceSheetArraySchema = z.array(BalanceSheetSchema)
export const CashFlowArraySchema = z.array(CashFlowStatementSchema)
export const KeyMetricsArraySchema = z.array(KeyMetricsSchema)
export const DCFArraySchema = z.array(DCFSchema)
export const HistoricalPriceArraySchema = z.array(HistoricalPriceSchema)
export const HistoricalPriceLightArraySchema = z.array(HistoricalPriceLightSchema)
export const EarningsArraySchema = z.array(EarningsSchema)
export const EarningsCalendarArraySchema = z.array(EarningsCalendarSchema)
export const NewsArraySchema = z.array(NewsItemSchema)
export const ScreenerArraySchema = z.array(ScreenerResultSchema)
export const BatchQuoteArraySchema = z.array(BatchQuoteSchema)
export const MoverArraySchema = z.array(MoverSchema)
export const AnalystEstimateArraySchema = z.array(AnalystEstimateSchema)
export const InsiderTradeArraySchema = z.array(InsiderTradeSchema)
export const InstitutionalHolderArraySchema = z.array(InstitutionalHolderSchema)