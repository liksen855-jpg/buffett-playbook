// Discord webhook poster — shared utility for all channel notifications.

const WEBHOOKS = {
  picks:    process.env.DISCORD_WEBHOOK_PICKS,
  watchlist: process.env.DISCORD_WEBHOOK_WATCHLIST,
  brief:    process.env.DISCORD_WEBHOOK_BRIEF,
};

const SENTIMENT_COLOR = { Bullish: 0x166534, Neutral: 0x92400e, Bearish: 0x991b1b };
const DIRECTION_COLOR  = { Long: 0x166534, Short: 0x991b1b, Watching: 0x1e40af };
const CONVICTION_EMOJI = { High: '🔥', Medium: '✅', Low: '👀' };
const STATUS_EMOJI     = { Open: '🟢', Watching: '🟡', Closed: '⚫' };

async function post(webhook, payload) {
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (_) { /* non-blocking */ }
}

// ── Picks notification ──────────────────────────────────────────────────────
export async function notifyPicks(picks) {
  if (!picks?.length) return;
  const top = picks.slice(0, 5);
  const fields = top.map(p => ({
    name: `${CONVICTION_EMOJI[p.conviction] || '✅'} ${p.symbol} — ${p.sentiment}`,
    value: [
      `**Score:** ${p.score}/100  |  **Conviction:** ${p.conviction}`,
      p.tags?.length ? `**Tags:** ${p.tags.join(', ')}` : '',
      p.thesis ? `> ${p.thesis.slice(0, 200)}${p.thesis.length > 200 ? '…' : ''}` : '',
    ].filter(Boolean).join('\n'),
    inline: false,
  }));

  await post(WEBHOOKS.picks, {
    embeds: [{
      title: '📊 Quality Picks Updated',
      description: `**${picks.length} pick${picks.length !== 1 ? 's' : ''}** on the board — top ${top.length} below.`,
      color: SENTIMENT_COLOR[top[0]?.sentiment] ?? 0x111111,
      fields,
      footer: { text: 'InsightInvests · insightinvests.com' },
      timestamp: new Date().toISOString(),
    }],
  });
}

// ── Positions notification ───────────────────────────────────────────────────
export async function notifyPositions(positions) {
  if (!positions?.length) return;
  const open = positions.filter(p => p.status !== 'Closed').slice(0, 6);
  const fields = open.map(p => {
    const upside = p.target && p.entry ? (((p.target - p.entry) / p.entry) * 100).toFixed(1) : null;
    return {
      name: `${STATUS_EMOJI[p.status] || '🟢'} ${p.symbol} · ${p.direction}`,
      value: [
        `**Entry:** $${p.entry}${p.target ? `  |  **Target:** $${p.target}` : ''}${upside ? `  |  **Upside:** ${upside}%` : ''}`,
        p.sizing ? `**Sizing:** ${p.sizing}` : '',
        p.report ? `> ${p.report.slice(0, 180)}${p.report.length > 180 ? '…' : ''}` : '',
      ].filter(Boolean).join('\n'),
      inline: false,
    };
  });

  await post(WEBHOOKS.watchlist, {
    embeds: [{
      title: '📋 Positions Updated',
      description: `**${positions.length} position${positions.length !== 1 ? 's' : ''}** on the book · ${open.length} open.`,
      color: 0x1e40af,
      fields,
      footer: { text: 'InsightInvests · insightinvests.com' },
      timestamp: new Date().toISOString(),
    }],
  });
}

// ── Market brief notification ────────────────────────────────────────────────
export async function notifyMarketBrief(quotes) {
  const symbols = Object.values(quotes);
  if (!symbols.length) return;

  const fields = symbols.slice(0, 10).map(q => {
    const sign  = q.changePct >= 0 ? '+' : '';
    const emoji = q.changePct >= 1 ? '🟢' : q.changePct <= -1 ? '🔴' : '🟡';
    return {
      name: `${emoji} ${q.symbol}`,
      value: `$${q.price}  |  ${sign}${Number(q.changePct).toFixed(2)}%`,
      inline: true,
    };
  });

  const gainers  = symbols.filter(q => q.changePct > 0).length;
  const losers   = symbols.filter(q => q.changePct < 0).length;
  const sentiment = gainers > losers ? '🟢 Risk-On' : gainers < losers ? '🔴 Risk-Off' : '🟡 Mixed';

  await post(WEBHOOKS.brief, {
    embeds: [{
      title: '🌅 Morning Market Brief',
      description: `**Watchlist snapshot** — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}\n**Sentiment:** ${sentiment}  |  ${gainers} up · ${losers} down`,
      color: gainers >= losers ? 0x166534 : 0x991b1b,
      fields,
      footer: { text: 'InsightInvests · insightinvests.com' },
      timestamp: new Date().toISOString(),
    }],
  });
}
