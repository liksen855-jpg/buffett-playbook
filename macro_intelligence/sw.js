/**
 * InsightInvest Service Worker
 * Intercepts data/fred_*.json and data/prices.json requests,
 * serves live data from FRED API (direct) and Yahoo Finance (via /api/yahoo-proxy).
 *
 * The FRED API key is set via index.html before this SW is registered.
 * It's stored in the Cache API so it survives page reloads.
 */

const CONFIG_CACHE = "insightinvest-config-v1";
const DATA_CACHE   = "insightinvest-data-v1";

// How long cached FRED data stays fresh (in ms):
// FRED daily series update ~3:30pm ET; monthly series update on release day.
// 4 hours is a good balance — fresh for daily use, not hammering the API.
const FRED_TTL_DAILY   = 4  * 60 * 60 * 1000;  // DFF, T10Y2Y, VIXCLS, etc.
const FRED_TTL_MONTHLY = 24 * 60 * 60 * 1000;  // FEDFUNDS, UNRATE, CPI, etc.
const PRICES_TTL       = 15 * 60 * 1000;        // prices.json: 15 min

// Monthly-release series (everything else is daily/weekly)
const MONTHLY_SERIES = new Set([
    "A191RL1Q225SBEA", "BAMLC0A0CMEY", "BAMLH0A0HYM2", "BCNSDODNS",
    "CPIAUCSL", "CPILFESL", "CPI_YOY", "DRCCLACBS", "DRSFRMACBS",
    "FEDFUNDS", "GFDEBTN", "GFDEGDP", "GS1", "GS10", "GS2", "GS30",
    "GS5", "GS7", "HHMSDODNS", "INDPRO", "M2SL", "THREEFYTP10",
    "UMCSENT", "UNRATE", "WTREGEN",
]);

// Yahoo Finance proxy endpoint (runs on same origin, no CORS issues)
const YF_PROXY_URL = '/api/yahoo-proxy';

// ── Config storage (FRED key) ────────────────────────────────────────────────

async function getConfig() {
    const cache = await caches.open(CONFIG_CACHE);
    const res = await cache.match("config");
    if (!res) return {};
    return res.json();
}

async function setConfig(cfg) {
    const cache = await caches.open(CONFIG_CACHE);
    await cache.put("config", new Response(JSON.stringify(cfg), {
        headers: { "Content-Type": "application/json" }
    }));
}

// ── Cached fetch helper ──────────────────────────────────────────────────────

async function cachedFetch(cacheKey, ttl, fetchFn) {
    const cache = await caches.open(DATA_CACHE);
    const cached = await cache.match(cacheKey);
    if (cached) {
        const age = Date.now() - Number(cached.headers.get("x-cached-at") || 0);
        if (age < ttl) return cached.clone();
    }
    try {
        const fresh = await fetchFn();
        const withMeta = new Response(fresh.body, {
            status: fresh.status,
            headers: {
                "Content-Type": "application/json",
                "x-cached-at": String(Date.now()),
                "Cache-Control": "no-store",
            }
        });
        await cache.put(cacheKey, withMeta.clone());
        return withMeta;
    } catch (err) {
        if (cached) return cached; // serve stale on network error
        throw err;
    }
}

// ── FRED live fetch ──────────────────────────────────────────────────────────

async function fetchFred(seriesId, apiKey) {
    const url = new URL("https://api.stlouisfed.org/fred/series/observations");
    url.searchParams.set("series_id", seriesId);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("file_type", "json");
    url.searchParams.set("sort_order", "asc");
    url.searchParams.set("observation_start", "2010-01-01");

    const r = await fetch(url.toString());
    if (!r.ok) throw new Error(`FRED ${seriesId}: HTTP ${r.status}`);
    const raw = await r.json();

    const data = [];
    for (const obs of raw.observations || []) {
        if (obs.value === ".") continue;
        const v = parseFloat(obs.value);
        if (!isNaN(v)) data.push({ date: obs.date, value: v });
    }

    // For CPI_YOY, compute YoY from CPIAUCSL if that's what was fetched
    return JSON.stringify(data);
}

// CPI_YOY is calculated from CPIAUCSL
async function fetchCpiYoy(apiKey) {
    const url = new URL("https://api.stlouisfed.org/fred/series/observations");
    url.searchParams.set("series_id", "CPIAUCSL");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("file_type", "json");
    url.searchParams.set("sort_order", "asc");
    url.searchParams.set("observation_start", "2009-01-01");

    const r = await fetch(url.toString());
    if (!r.ok) throw new Error(`FRED CPIAUCSL: HTTP ${r.status}`);
    const raw = await r.json();

    const byDate = {};
    for (const obs of raw.observations || []) {
        if (obs.value !== ".") byDate[obs.date] = parseFloat(obs.value);
    }
    const result = [];
    for (const date of Object.keys(byDate).sort()) {
        const year = parseInt(date.slice(0, 4));
        const prevDate = `${year - 1}${date.slice(4)}`;
        if (prevDate in byDate && byDate[prevDate] !== 0) {
            const yoy = (byDate[date] - byDate[prevDate]) / byDate[prevDate] * 100;
            result.push({ date, value: Math.round(yoy * 1000) / 1000 });
        }
    }
    return JSON.stringify(result);
}

// ── Yahoo Finance price fetch (via local proxy) ──────────────────────────────

async function fetchPrices(existingPrices) {
    const symbols = Object.keys(existingPrices);
    if (!symbols.length) return JSON.stringify({ ts: new Date().toISOString(), data: {} });

    try {
        const r = await fetch(`${YF_PROXY_URL}?symbols=${symbols.join(',')}`, {
            signal: AbortSignal.timeout(15000),
        });
        if (!r.ok) throw new Error(`Proxy HTTP ${r.status}`);
        const payload = await r.json();
        const fresh = payload?.data || {};

        // Merge: fresh data wins, keep existing as fallback
        const merged = { ...existingPrices };
        for (const sym of symbols) {
            if (fresh[sym]) {
                merged[sym] = fresh[sym];
            }
        }
        return JSON.stringify({
            ts: payload?.ts || new Date().toISOString(),
            data: merged,
        });
    } catch (err) {
        console.warn('[SW] YF proxy failed, keeping stale prices:', err.message);
        return JSON.stringify({
            ts: new Date().toISOString(),
            data: existingPrices,
        });
    }
}

// ── Service worker event handlers ────────────────────────────────────────────

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

// Receive FRED API key from the page
self.addEventListener("message", async event => {
    if (event.data?.type === "SET_FRED_KEY") {
        await setConfig({ fredKey: event.data.key });
        event.ports[0]?.postMessage({ ok: true });
    }
    if (event.data?.type === "CLEAR_CACHE") {
        await caches.delete(DATA_CACHE);
        event.ports[0]?.postMessage({ ok: true });
    }
});

self.addEventListener("fetch", event => {
    const url = new URL(event.request.url);
    const path = url.pathname;

    // Only intercept our data files
    const fredMatch = path.match(/\/data\/fred_([A-Z0-9_]+)\.json$/);
    const isPrices  = path.endsWith("/data/prices.json");

    if (!fredMatch && !isPrices) return;

    event.respondWith((async () => {
        const { fredKey } = await getConfig();

        // ── prices.json ──
        if (isPrices) {
            if (!fredKey) {
                // No key yet — fall through to static file
                return fetch(event.request);
            }
            return cachedFetch("prices.json", PRICES_TTL, async () => {
                // read existing prices for symbol list + fallback values
                const existing = await fetch(event.request).then(r => r.json()).catch(() => ({ data: {} }));
                const body = await fetchPrices(existing.data);
                return new Response(body, { headers: { "Content-Type": "application/json" } });
            });
        }

        // ── fred_SERIES.json ──
        const seriesId = fredMatch[1];

        // TEDRATE is discontinued — always serve static
        if (seriesId === "TEDRATE") return fetch(event.request);

        if (!fredKey) return fetch(event.request);

        const ttl = MONTHLY_SERIES.has(seriesId) ? FRED_TTL_MONTHLY : FRED_TTL_DAILY;

        return cachedFetch(`fred_${seriesId}`, ttl, async () => {
            const body = seriesId === "CPI_YOY"
                ? await fetchCpiYoy(fredKey)
                : await fetchFred(seriesId, fredKey);
            return new Response(body, { headers: { "Content-Type": "application/json" } });
        });
    })());
});
