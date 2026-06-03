/**
 * Fallback demo stock data so the terminal works
 * even when FMP screener or auth APIs are unavailable.
 */

import type { Stock } from '../types/terminal';

export const DEMO_STOCKS: Stock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 213.07, change: 2.15, changesPercentage: 1.02, marketCap: 3250000000000, volume: 45000000, avgVolume: 52000000, pe: 32.5, eps: 6.55, dividendYield: 0.0052, sector: 'Technology', industry: 'Consumer Electronics', exchange: 'NASDAQ', beta: 1.24, yearHigh: 237.49, yearLow: 164.08 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: 437.58, change: 3.82, changesPercentage: 0.88, marketCap: 3240000000000, volume: 18000000, avgVolume: 22000000, pe: 36.2, eps: 12.09, dividendYield: 0.0068, sector: 'Technology', industry: 'Software', exchange: 'NASDAQ', beta: 0.92, yearHigh: 468.35, yearLow: 362.90 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 178.35, change: -0.92, changesPercentage: -0.51, marketCap: 2200000000000, volume: 21000000, avgVolume: 25000000, pe: 25.4, eps: 7.02, dividendYield: 0.0045, sector: 'Communication Services', industry: 'Internet Content', exchange: 'NASDAQ', beta: 1.05, yearHigh: 191.75, yearLow: 129.40 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 198.42, change: 1.25, changesPercentage: 0.63, marketCap: 2050000000000, volume: 35000000, avgVolume: 42000000, pe: 58.3, eps: 3.40, dividendYield: 0, sector: 'Consumer Cyclical', industry: 'Internet Retail', exchange: 'NASDAQ', beta: 1.18, yearHigh: 201.20, yearLow: 118.35 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 175.34, change: -4.21, changesPercentage: -2.35, marketCap: 560000000000, volume: 98000000, avgVolume: 105000000, pe: 42.1, eps: 4.17, dividendYield: 0, sector: 'Consumer Cyclical', industry: 'Auto Manufacturers', exchange: 'NASDAQ', beta: 2.28, yearHigh: 299.29, yearLow: 138.80 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 124.30, change: 2.85, changesPercentage: 2.35, marketCap: 3050000000000, volume: 280000000, avgVolume: 320000000, pe: 62.5, eps: 1.99, dividendYield: 0.0003, sector: 'Technology', industry: 'Semiconductors', exchange: 'NASDAQ', beta: 1.75, yearHigh: 153.13, yearLow: 39.23 },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 504.25, change: 5.12, changesPercentage: 1.03, marketCap: 1280000000000, volume: 12000000, avgVolume: 15000000, pe: 27.8, eps: 18.14, dividendYield: 0.0040, sector: 'Communication Services', industry: 'Internet Content', exchange: 'NASDAQ', beta: 1.21, yearHigh: 531.49, yearLow: 274.38 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 205.80, change: 0.95, changesPercentage: 0.46, marketCap: 590000000000, volume: 8000000, avgVolume: 9500000, pe: 12.3, eps: 16.73, dividendYield: 0.0225, sector: 'Financial Services', industry: 'Banks', exchange: 'NYSE', beta: 1.10, yearHigh: 215.76, yearLow: 136.02 },
  { symbol: 'V', name: 'Visa Inc.', price: 285.42, change: 1.18, changesPercentage: 0.42, marketCap: 620000000000, volume: 4500000, avgVolume: 5500000, pe: 30.1, eps: 9.48, dividendYield: 0.0075, sector: 'Financial Services', industry: 'Credit Services', exchange: 'NYSE', beta: 0.95, yearHigh: 290.96, yearLow: 227.68 },
  { symbol: 'WMT', name: 'Walmart Inc.', price: 92.45, change: -0.35, changesPercentage: -0.38, marketCap: 745000000000, volume: 14000000, avgVolume: 16000000, pe: 28.4, eps: 3.25, dividendYield: 0.0135, sector: 'Consumer Defensive', industry: 'Discount Stores', exchange: 'NYSE', beta: 0.52, yearHigh: 105.50, yearLow: 55.46 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', price: 148.20, change: 0.42, changesPercentage: 0.28, marketCap: 357000000000, volume: 6500000, avgVolume: 7800000, pe: 15.2, eps: 9.75, dividendYield: 0.0310, sector: 'Healthcare', industry: 'Drug Manufacturers', exchange: 'NYSE', beta: 0.55, yearHigh: 175.97, yearLow: 140.34 },
  { symbol: 'UNH', name: 'UnitedHealth Group', price: 520.15, change: -2.30, changesPercentage: -0.44, marketCap: 480000000000, volume: 3200000, avgVolume: 4000000, pe: 19.8, eps: 26.27, dividendYield: 0.0145, sector: 'Healthcare', industry: 'Healthcare Plans', exchange: 'NYSE', beta: 0.65, yearHigh: 630.00, yearLow: 436.00 },
  { symbol: 'HD', name: 'Home Depot Inc.', price: 345.80, change: 1.85, changesPercentage: 0.54, marketCap: 345000000000, volume: 2800000, avgVolume: 3500000, pe: 23.1, eps: 14.97, dividendYield: 0.0265, sector: 'Consumer Cyclical', industry: 'Home Improvement', exchange: 'NYSE', beta: 0.98, yearHigh: 391.19, yearLow: 274.00 },
  { symbol: 'PG', name: 'Procter & Gamble', price: 168.50, change: 0.65, changesPercentage: 0.39, marketCap: 397000000000, volume: 5000000, avgVolume: 6200000, pe: 27.5, eps: 6.13, dividendYield: 0.0235, sector: 'Consumer Defensive', industry: 'Household Products', exchange: 'NYSE', beta: 0.42, yearHigh: 178.00, yearLow: 141.45 },
  { symbol: 'MA', name: 'Mastercard Inc.', price: 458.20, change: 2.10, changesPercentage: 0.46, marketCap: 425000000000, volume: 2200000, avgVolume: 2800000, pe: 35.2, eps: 13.02, dividendYield: 0.0055, sector: 'Financial Services', industry: 'Credit Services', exchange: 'NYSE', beta: 1.08, yearHigh: 490.00, yearLow: 357.00 },
];

export const DEMO_PULSE = [
  { symbol: 'SPY', name: 'S&P 500', price: 532.15, change: 4.25, changesPercentage: 0.80 },
  { symbol: 'QQQ', name: 'Nasdaq 100', price: 468.32, change: 3.85, changesPercentage: 0.83 },
  { symbol: 'IWM', name: 'Russell 2000', price: 198.45, change: -1.20, changesPercentage: -0.60 },
  { symbol: 'VIX', name: 'VIX', price: 14.25, change: -0.85, changesPercentage: -5.62 },
  { symbol: 'DXY', name: 'US Dollar', price: 104.85, change: 0.15, changesPercentage: 0.14 },
  { symbol: 'GLD', name: 'Gold', price: 218.50, change: 1.25, changesPercentage: 0.58 },
  { symbol: 'USO', name: 'Oil', price: 78.35, change: -0.45, changesPercentage: -0.57 },
  { symbol: 'BTC', name: 'Bitcoin', price: 68500, change: 1200, changesPercentage: 1.78 },
];

export const DEMO_NEWS = [
  { symbol: 'AAPL', title: 'Apple unveils new AI features for iPhone 16 lineup', publishedDate: '2024-06-03T10:30:00Z', site: 'Reuters', snippet: 'Apple announced a suite of on-device AI capabilities...' },
  { symbol: 'NVDA', title: 'NVIDIA stock surges on Blackwell chip demand', publishedDate: '2024-06-03T09:15:00Z', site: 'Bloomberg', snippet: 'Analysts raise price targets as data center revenue explodes...' },
  { symbol: 'TSLA', title: 'Tesla deliveries miss estimates in Q2', publishedDate: '2024-06-02T16:45:00Z', site: 'CNBC', snippet: 'EV maker delivers 423K vehicles vs 445K expected...' },
  { symbol: 'MSFT', title: 'Microsoft Copilot revenue hits $10B run rate', publishedDate: '2024-06-02T14:20:00Z', site: 'TechCrunch', snippet: 'AI-powered productivity suite driving cloud growth...' },
  { symbol: 'JPM', title: 'JPMorgan raises dividend by 8%', publishedDate: '2024-06-01T11:00:00Z', site: 'WSJ', snippet: 'Largest US bank by assets continues capital return...' },
  { symbol: 'META', title: 'Meta unveils Llama 4 with real-time reasoning', publishedDate: '2024-06-01T08:30:00Z', site: 'The Verge', snippet: 'Open-source model rivals GPT-4 on benchmarks...' },
  { symbol: 'GOOGL', title: 'Google Cloud revenue jumps 28% YoY', publishedDate: '2024-05-31T20:15:00Z', site: 'FT', snippet: 'Enterprise adoption of Gemini AI accelerates...' },
  { symbol: 'AMZN', title: 'Amazon AWS launches new AI training chips', publishedDate: '2024-05-31T18:00:00Z', site: 'Ars Technica', snippet: 'Trainium3 promises 4x performance improvement...' },
];

export const DEMO_PICKS = [
  { symbol: 'NVDA', score: 92, sentiment: 'bullish' as const, conviction: 'high' as const, narrative: 'AI infrastructure build-out is a multi-year tailwind with unmatched GPU dominance.', tags: ['AI', 'semiconductors', 'growth'], thesis: 'Data center revenue growing 400% YoY. Blackwell architecture extends moat. Pricing power is unprecedented in semiconductor history.', featured: true },
  { symbol: 'MSFT', score: 88, sentiment: 'bullish' as const, conviction: 'high' as const, narrative: 'Copilot monetization is the fastest product ramp in enterprise software history.', tags: ['AI', 'cloud', 'dividend'], thesis: 'Azure + OpenAI integration creates a sticky ecosystem. Every Office 365 seat is a Copilot upsell opportunity. Margins expanding.', featured: true },
  { symbol: 'V', score: 78, sentiment: 'bullish' as const, conviction: 'medium' as const, narrative: 'Network effects + secular shift to digital payments create a wide, durable moat.', tags: ['fintech', 'moat', 'dividend'], thesis: 'Payment volume grows 8-10% annually with minimal incremental cost. Regulatory risk is manageable. Valuation reasonable at 30x earnings.' },
  { symbol: 'JNJ', score: 72, sentiment: 'neutral' as const, conviction: 'medium' as const, narrative: 'Talc litigation overhang masks a quality pharma + medtech franchise.', tags: ['healthcare', 'dividend', 'value'], thesis: 'MedTech division growing 6% organically. Pharma pipeline has 10+ blockbusters. 3% yield with 62 consecutive years of increases.' },
  { symbol: 'TSLA', score: 45, sentiment: 'bearish' as const, conviction: 'high' as const, narrative: 'Competition eroding EV dominance; Robotaxi timeline uncertain.', tags: ['EV', 'risky', 'short'], thesis: 'BYD and Chinese OEMs are gaining share rapidly. FSD has been "next year" for 5 years. Valuation still assumes robotaxi monopoly.' },
];
