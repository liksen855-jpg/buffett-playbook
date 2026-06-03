/**
 * Terminal data types — ported from siv/ global data layer
 * These represent the shape of data flowing through the Members terminal
 */

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changesPercentage: number;
  marketCap: number;
  volume: number;
  avgVolume: number;
  pe?: number;
  eps?: number;
  dividendYield?: number;
  sector?: string;
  industry?: string;
  country?: string;
  exchange?: string;
  beta?: number;
  yearHigh?: number;
  yearLow?: number;
  // Screener fields
  priceToBookRatio?: number;
  priceToSalesRatio?: number;
  priceEarningsToGrowthRatio?: number;
  debtToEquity?: number;
  returnOnEquity?: number;
  returnOnAssets?: number;
  returnOnInvestedCapital?: number;
  grossProfitMargin?: number;
  operatingProfitMargin?: number;
  netProfitMargin?: number;
  freeCashFlowPerShare?: number;
  revenuePerShare?: number;
  revenueGrowth?: number;
  earningsGrowth?: number;
  freeCashFlowGrowth?: number;
  debtGrowth?: number;
  totalDebt?: number;
  totalCash?: number;
  totalEquity?: number;
  totalAssets?: number;
  totalInvestments?: number;
  totalLiabilities?: number;
  enterpriseValue?: number;
  ebitda?: number;
  ebitdaGrowth?: number;
  numberOfShares?: number;
  [key: string]: unknown;
}

export interface PulseTile {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changesPercentage: number;
}

export interface NewsItem {
  symbol: string;
  title: string;
  snippet?: string;
  publishedDate: string;
  site?: string;
  url?: string;
  image?: string;
}

export interface Earning {
  symbol: string;
  date: string;
  epsEstimated?: number;
  eps?: number;
  revenueEstimated?: number;
  revenue?: number;
  time?: string;
}

export interface Pick {
  symbol: string;
  score: number;
  sentiment: 'bullish' | 'neutral' | 'bearish';
  conviction: 'high' | 'medium' | 'low';
  narrative: string;
  tags: string[];
  thesis: string;
  featured?: boolean;
}

export interface Holding {
  symbol: string;
  shares: number;
  costBasis: number;
}

export interface Portfolio {
  cash: number;
  holdings: Holding[];
}

export interface Preset {
  id: string;
  label: string;
  query: string;
}

export interface Breadth {
  advancers: number;
  decliners: number;
  unchanged: number;
}

export interface DashboardData {
  stocks: Stock[];
  stockBySym: Record<string, Stock>;
  pulse: PulseTile[];
  news: NewsItem[];
  earnings: Earning[];
  breadth: Breadth;
  picks: Pick[];
  presets: Preset[];
  portfolio: Portfolio;
  defaultWatchlist: string[];
}

export interface UserData {
  name: string;
  email: string;
}
