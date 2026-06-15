// Discord slash command interaction handler.
// Registered commands: /quote, /picks, /brief, /watchlist

import { kvGet } from '../lib/kv.js';
import { fmpBatchQuotes } from '../lib/fmp.js';

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
const BRIEF_WATCHLIST = ['SPY','QQQ','DIA','AAPL','MSFT','NVDA','HOOD','SOFI','COIN','GLD'];

// ── Ed25519 signature verification ─────────────────────────────────────────
async function verifySignature(req, rawBody) {
  const sig       = req.headers['x-signature-ed25519'];
  const timestamp = req.headers['x-signature-timestamp'];
  if (!sig || !timestamp) return false;
  try {
    const key = await crypto.subtle.importKey(
      'raw', hexToBytes(PUBLIC_KEY), { name: 'Ed25519' }, false, ['verify']
    );
    const msg = new TextEncoder().encode(timestamp + rawBody);
    return await crypto.subtle.verify('Ed25519', key, hexToBytes(sig), msg);
  } catch { return false; }
}
function hexToBytes(hex) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return arr;
}

// ── Response helpers ────────────────────────────────────────────────────────
const reply     = (content)        => ({ type: 4, data: { content } });
const embed     = (data)           => ({ type: 4, data: { embeds: [data] } });
const ephemeral = (content)        => ({ type: 4, data: { content, flags: 64 } });

// ── Command handlers ────────────────────────────────────────────────────────
async function handleQuote(symbol) {
  const sym = symbol.toUpperCase().trim();
  try {
    const batch = await fmpBatchQuotes([sym], { cacheSeconds: 30 });
    const q = batch?.[sym];
    if (!q) return ephemeral(`Could not find a quote for **${sym}**. Check the ticker and try again.`);
    const sign    = q.changesPercentage >= 0 ? '+' : '';
    const emoji   = q.changesPercentage >= 1 ? '🟢' : q.changesPercentage <= -1 ? '🔴' : '🟡';
    const color   = q.changesPercentage >= 0 ? 0x166534 : 0x991b1b;
    return embed({
      title: `${emoji} ${sym} — ${q.name || sym}`,
      color,
      fields: [
        { name: 'Price',   value: `**$${q.price}**`,                              inline: true },
        { name: 'Change',  value: `${sign}${Number(q.changesPercentage).toFixed(2)}%`, inline: true },
        { name: 'Volume',  value: q.volume ? Number(q.volume).toLocaleString() : '—', inline: true },
        ...(q.marketCap ? [{ name: 'Mkt Cap', value: `$${(q.marketCap/1e9).toFixed(1)}B`, inline: true }] : []),
        ...(q.pe        ? [{ name: 'P/E',     value: String(q.pe),                        inline: true }] : []),
      ],
      footer: { text: 'InsightInvests · insightinvests.com' },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return ephemeral(`Failed to fetch quote for **${sym}**. Try again shortly.`);
  }
}

async function handlePicks() {
  try {
    const data  = await kvGet('picks:v1');
    const picks = data?.picks;
    if (!picks?.length) return ephemeral('No picks on the board yet.');
    const EMOJI = { High: '🔥', Medium: '✅', Low: '👀' };
    const COLOR = { Bullish: 0x166534, Neutral: 0x92400e, Bearish: 0x991b1b };
    const fields = picks.slice(0, 6).map(p => ({
      name:   `${EMOJI[p.conviction] || '✅'} ${p.symbol} · ${p.sentiment} · Score ${p.score}/100`,
      value:  p.thesis ? `> ${p.thesis.slice(0, 160)}${p.thesis.length > 160 ? '…' : ''}` : `Conviction: ${p.conviction}`,
      inline: false,
    }));
    return embed({
      title:       `📊 Quality Picks (${picks.length})`,
      description: 'Current editorial picks from InsightInvests.',
      color:       COLOR[picks[0]?.sentiment] ?? 0x111111,
      fields,
      footer:      { text: 'InsightInvests · insightinvests.com' },
      timestamp:   new Date().toISOString(),
    });
  } catch {
    return ephemeral('Could not load picks right now. Try again shortly.');
  }
}

async function handleWatchlist() {
  try {
    const data      = await kvGet('positions:v1');
    const positions = data?.positions;
    if (!positions?.length) return ephemeral('No positions on the book yet.');
    const open   = positions.filter(p => p.status !== 'Closed').slice(0, 6);
    const STATUS = { Open: '🟢', Watching: '🟡', Closed: '⚫' };
    const fields = open.map(p => {
      const upside = p.target && p.entry ? `  |  **Upside:** ${(((p.target - p.entry) / p.entry) * 100).toFixed(1)}%` : '';
      return {
        name:   `${STATUS[p.status] || '🟢'} ${p.symbol} · ${p.direction}`,
        value:  `**Entry:** $${p.entry}${p.target ? `  |  **Target:** $${p.target}` : ''}${upside}${p.sizing ? `\n${p.sizing}` : ''}`,
        inline: false,
      };
    });
    return embed({
      title:       `📋 Open Positions (${open.length} of ${positions.length})`,
      color:       0x1e40af,
      fields,
      footer:      { text: 'InsightInvests · insightinvests.com' },
      timestamp:   new Date().toISOString(),
    });
  } catch {
    return ephemeral('Could not load positions right now. Try again shortly.');
  }
}

async function handleBrief() {
  try {
    const batch  = await fmpBatchQuotes(BRIEF_WATCHLIST, { cacheSeconds: 60 });
    const quotes = BRIEF_WATCHLIST.map(s => batch?.[s]).filter(Boolean);
    if (!quotes.length) return ephemeral('Could not fetch market data right now.');
    const gainers = quotes.filter(q => q.changesPercentage > 0).length;
    const losers  = quotes.filter(q => q.changesPercentage < 0).length;
    const sentiment = gainers > losers ? '🟢 Risk-On' : gainers < losers ? '🔴 Risk-Off' : '🟡 Mixed';
    const fields = quotes.slice(0, 10).map(q => {
      const sign  = q.changesPercentage >= 0 ? '+' : '';
      const emoji = q.changesPercentage >= 1 ? '🟢' : q.changesPercentage <= -1 ? '🔴' : '🟡';
      return { name: `${emoji} ${q.symbol}`, value: `$${q.price}  ${sign}${Number(q.changesPercentage).toFixed(2)}%`, inline: true };
    });
    return embed({
      title:       '🌅 Market Brief',
      description: `**${sentiment}** — ${gainers} up · ${losers} down`,
      color:       gainers >= losers ? 0x166534 : 0x991b1b,
      fields,
      footer:      { text: 'InsightInvests · insightinvests.com' },
      timestamp:   new Date().toISOString(),
    });
  } catch {
    return ephemeral('Could not fetch market data right now.');
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  // Read raw body for signature verification
  const rawBody = await new Promise(resolve => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
  });

  if (!await verifySignature(req, rawBody)) {
    res.status(401).send('Invalid request signature');
    return;
  }

  const interaction = JSON.parse(rawBody);

  // PING
  if (interaction.type === 1) { res.json({ type: 1 }); return; }

  // APPLICATION_COMMAND
  if (interaction.type === 2) {
    const name   = interaction.data?.name;
    const opts   = interaction.data?.options || [];
    const symbol = opts.find(o => o.name === 'symbol')?.value;

    let response;
    if      (name === 'quote')     response = await handleQuote(symbol || '');
    else if (name === 'picks')     response = await handlePicks();
    else if (name === 'watchlist') response = await handleWatchlist();
    else if (name === 'brief')     response = await handleBrief();
    else                           response = ephemeral('Unknown command.');

    res.json(response);
    return;
  }

  res.status(400).end();
}
