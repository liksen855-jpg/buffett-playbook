/**
 * Shared KV (Upstash/Vercel KV) utilities.
 * Single source of truth for KV configuration and commands.
 */

const KV_URL = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export function kvConfigured() {
  return !!(KV_URL() && KV_TOKEN());
}

export async function kvCmd(args) {
  const r = await fetch(KV_URL(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error('KV ' + r.status);
  const j = await r.json();
  return j.result;
}

export async function kvGet(key) {
  const raw = await kvCmd(['GET', key]);
  if (raw == null) return null;
  try { return JSON.parse(raw); } catch (_) { return null; }
}

export async function kvSet(key, val) {
  return kvCmd(['SET', key, JSON.stringify(val)]);
}

export async function kvGetWithTTL(key, ttlSeconds = 300) {
  // Try GET first; if miss, caller should fetch and SETEX
  const raw = await kvCmd(['GET', key]);
  if (raw == null) return { hit: false, data: null };
  try { return { hit: true, data: JSON.parse(raw) }; } catch (_) { return { hit: false, data: null }; }
}

export async function kvSetEx(key, val, ttlSeconds = 300) {
  return kvCmd(['SETEX', key, String(ttlSeconds), JSON.stringify(val)]);
}
