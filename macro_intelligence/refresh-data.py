#!/usr/bin/env python3
"""
refresh-data.py — Refreshes InsightInvest static JSON files with live data.

Usage:
  python3 refresh-data.py --fred-key YOUR_KEY

Get a free FRED API key (takes ~1 min) at:
  https://fred.stlouisfed.org/docs/api/api_key.html

Run this before opening the dashboard, or set up a cron job:
  # refresh every morning at 7am:
  0 7 * * * cd /path/to/macro_intelligence && python3 refresh-data.py --fred-key YOUR_KEY
"""

import json, sys, time, argparse
from datetime import datetime, timezone
from pathlib import Path
import urllib.request, urllib.parse

BASE = Path(__file__).parent / "data"

# All directly fetchable FRED series
FRED_SERIES = [
    "A191RL1Q225SBEA",  # GDP growth QoQ
    "AAA10Y",           # AAA-Treasury spread
    "BAA10Y",           # BAA-Treasury spread (Moody's)
    "BAMLC0A0CMEY",     # IG corporate yield (ICE BofA)
    "BAMLH0A0HYM2",     # HY spread (ICE BofA)
    "BCNSDODNS",        # Business nonfinancial debt
    "CPIAUCSL",         # CPI All Urban (also source for CPI_YOY)
    "CPILFESL",         # Core CPI (ex food & energy)
    "DEXUSEU",          # EUR/USD exchange rate
    "DFF",              # Daily effective fed funds rate
    "DFII10",           # 10Y TIPS yield
    "DFII20",           # 20Y TIPS yield
    "DFII5",            # 5Y TIPS yield
    "DRCCLACBS",        # Credit card delinquency rate
    "DRSFRMACBS",       # Mortgage delinquency rate
    "FEDFUNDS",         # Monthly fed funds rate
    "GFDEBTN",          # Federal debt total
    "GFDEGDP",          # Federal debt as % of GDP (mapped to GFDEGDQ188S below)
    "GS1",              # 1Y constant maturity treasury
    "GS10",             # 10Y constant maturity treasury
    "GS2",              # 2Y constant maturity treasury
    "GS30",             # 30Y constant maturity treasury
    "GS5",              # 5Y constant maturity treasury
    "GS7",              # 7Y constant maturity treasury
    "HHMSDODNS",        # Household nonfinancial debt
    "INDPRO",           # Industrial production index
    "M2SL",             # M2 money supply
    "RRPONTSYD",        # Overnight reverse repo
    "T10Y2Y",           # 10Y-2Y yield spread
    "T10Y3M",           # 10Y-3M yield spread
    "T10YIE",           # 10Y breakeven inflation
    "T5YIE",            # 5Y breakeven inflation
    "T5YIFR",           # 5Y5Y forward inflation rate
    "TB3MS",            # 3M treasury bill
    "THREEFYTP10",      # 10Y term premium (ACM)
    "UMCSENT",          # U of Michigan consumer sentiment
    "UNRATE",           # Unemployment rate
    "VIXCLS",           # VIX close
    "WALCL",            # Fed balance sheet (total assets)
    "WRESBAL",          # Bank reserves
    "WTREGEN",          # Net exports (trade balance proxy)
]
# TEDRATE is discontinued by FRED (last data ~2023-01), kept as static

SYMBOLS = [
    "SPY", "QQQ", "IWM", "DIA", "^VIX", "GLD", "TLT", "DX-Y.NYB",
    "XLK", "XLF", "XLE", "XLV", "XLI", "XLP", "XLY", "XLU", "XLB", "XLRE", "XLC",
    "CL=F", "BZ=F", "GC=F", "HG=F", "SI=F", "NG=F", "ZW=F", "ZC=F",
    "^VIX9D", "^VIX3M", "^VIX6M", "^VVIX",
    "EURUSD=X", "GBPUSD=X", "USDJPY=X", "USDCHF=X", "USDBRL=X",
    "USDMXN=X", "USDCNY=X", "USDKRW=X", "USDINR=X",
    "GSG", "MTUM", "QUAL", "VLUE", "USMV", "IWF", "SIZE", "RSP", "IWD",
    "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "JPM",
]


def fetch_url(url, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode())


# Some series IDs in the JSON files differ from the FRED API series IDs
FRED_ID_MAP = {
    "GFDEGDP": "GFDEGDQ188S",  # FRED renamed it; file stays fred_GFDEGDP.json
}


def fetch_fred(series_id, api_key, start="2010-01-01"):
    url = (
        "https://api.stlouisfed.org/fred/series/observations"
        f"?series_id={series_id}&api_key={api_key}&file_type=json"
        f"&sort_order=asc&observation_start={start}"
    )
    data = fetch_url(url)
    result = []
    for obs in data.get("observations", []):
        v = obs["value"]
        if v == ".":  # FRED uses "." for unreleased observations
            continue
        try:
            result.append({"date": obs["date"], "value": float(v)})
        except ValueError:
            continue
    return result


def compute_cpi_yoy(cpiaucsl_data):
    """YoY % change from monthly CPIAUCSL — same window as the static CPI_YOY file."""
    by_date = {d["date"]: d["value"] for d in cpiaucsl_data}
    result = []
    for date in sorted(by_date):
        year = int(date[:4])
        prev_date = f"{year - 1}{date[4:]}"
        if prev_date in by_date and by_date[prev_date] != 0:
            yoy = (by_date[date] - by_date[prev_date]) / by_date[prev_date] * 100
            result.append({"date": date, "value": round(yoy, 3)})
    return result


def fetch_yahoo(symbol):
    encoded = urllib.parse.quote(symbol)
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{encoded}?interval=1d&range=2d"
    try:
        d = fetch_url(url)
        meta = d["chart"]["result"][0]["meta"]
        price = meta.get("regularMarketPrice") or meta.get("previousClose", 0)
        prev  = meta.get("previousClose") or meta.get("chartPreviousClose", price)
        change = price - prev if prev else 0
        pct    = change / prev * 100 if prev else 0
        name   = (meta.get("longName") or meta.get("shortName") or symbol)[:34]
        return {
            "symbol": symbol,
            "price": round(price, 4),
            "change": round(change, 4),
            "changePct": round(pct, 6),
            "name": name,
        }
    except Exception:
        return None


def main():
    parser = argparse.ArgumentParser(description="Refresh InsightInvest data files")
    parser.add_argument("--fred-key", required=True, help="FRED API key")
    parser.add_argument("--skip-fred", action="store_true")
    parser.add_argument("--skip-prices", action="store_true")
    args = parser.parse_args()

    # ── FRED ────────────────────────────────────────────────────────────────
    if not args.skip_fred:
        cpiaucsl_data = None
        errors = []
        print(f"Refreshing {len(FRED_SERIES)} FRED series...")
        for i, series in enumerate(FRED_SERIES):
            label = f"[{i+1:02d}/{len(FRED_SERIES)}] {series:<24}"
            try:
                api_id = FRED_ID_MAP.get(series, series)
                data = fetch_fred(api_id, args.fred_key)
                if not data:
                    print(f"{label} EMPTY — keeping existing")
                    continue
                path = BASE / f"fred_{series}.json"
                path.write_text(json.dumps(data, separators=(",", ":")))
                print(f"{label} {len(data):>4} obs  (last: {data[-1]['date']} = {data[-1]['value']})")
                if series == "CPIAUCSL":
                    cpiaucsl_data = data
            except Exception as e:
                print(f"{label} ERROR: {e}")
                errors.append(series)
            time.sleep(0.3)  # FRED rate limit: 120 req/min

        # CPI_YOY is computed, not fetched
        if cpiaucsl_data:
            yoy = compute_cpi_yoy(cpiaucsl_data)
            (BASE / "fred_CPI_YOY.json").write_text(json.dumps(yoy, separators=(",", ":")))
            print(f"{'':>8}{'CPI_YOY (calculated)':<24} {len(yoy):>4} obs  (last: {yoy[-1]['date']} = {yoy[-1]['value']})")

        if errors:
            print(f"\nFailed FRED series (kept existing data): {', '.join(errors)}")

    # ── Yahoo Finance prices ────────────────────────────────────────────────
    if not args.skip_prices:
        print(f"\nRefreshing {len(SYMBOLS)} Yahoo Finance quotes...")
        existing_data = json.loads((BASE / "prices.json").read_text()).get("data", {})
        updated = {}
        failed = []
        for i, sym in enumerate(SYMBOLS):
            label = f"  [{i+1:02d}/{len(SYMBOLS)}] {sym:<12}"
            result = fetch_yahoo(sym)
            if result:
                updated[sym] = result
                print(f"{label} ${result['price']:.2f}  ({result['changePct']:+.2f}%)")
            else:
                updated[sym] = existing_data.get(sym, {})
                failed.append(sym)
                print(f"{label} FAILED — keeping existing")
            time.sleep(0.08)

        prices_out = {
            "ts": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "data": updated,
        }
        (BASE / "prices.json").write_text(json.dumps(prices_out, separators=(",", ":")))
        print(f"\nprices.json updated ({len(updated) - len(failed)}/{len(SYMBOLS)} live)")
        if failed:
            print(f"Failed quotes (kept existing): {', '.join(failed)}")

    print("\n✓ Done. Reload the dashboard to see fresh data.")


if __name__ == "__main__":
    main()
