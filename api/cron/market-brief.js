// Cron job — runs daily at 8:00 AM UTC (4am ET / 8am MYT).
// Fetches quotes for the watchlist and posts a morning brief to Discord.

import { notifyMarketBrief } from '../../lib/discord.js';
import { fmpBatchQuotes } from '../../lib/fmp.js';

const WATCHLIST = [
  'SPY', 'QQQ', 'DIA',       // indices
  'AAPL', 'MSFT', 'NVDA',    // mega-cap tech
  'HOOD', 'SOFI', 'COIN',    // fintech
  'GLD', 'USO',              // commodities
];

export default async function handler(req, res) {
  // Protect: only Vercel cron or your own server can call this
  const auth = req.headers['authorization'];
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  try {
    const quotes = await fmpBatchQuotes(WATCHLIST, { cacheSeconds: 0 });
    const data = {};
    for (const sym of WATCHLIST) {
      const q = quotes[sym];
      if (!q) continue;
      data[sym] = {
        symbol: sym,
        price: q.price ?? 0,
        changePct: q.changesPercentage ?? q.changePercentage ?? 0,
      };
    }
    await notifyMarketBrief(data);
    res.status(200).json({ ok: true, symbols: Object.keys(data).length });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
