/** Pure derivations from selected execution rows (volume-weighted prices). */

export function pipSizeFor(symbol: string): number | null {
  const s = symbol.trim().toUpperCase();
  if (!s) return null;
  if (/JPY$/.test(s)) return 0.01;
  if (s === "XAUUSD") return 0.1;
  if (s === "XAGUSD") return 0.01;
  if (/^(NQ|ES|BTC)/.test(s)) return null;
  if (/^[A-Z]{6}$/.test(s)) return 0.0001;
  return null;
}

/** Price moved between VWAP open and close, in pips (or raw points when no pip convention). */
export function movePips(
  symbol: string,
  open: number,
  close: number,
): { value: string; points: boolean } {
  if (!Number.isFinite(open) || !Number.isFinite(close)) return { value: "", points: false };
  const size = pipSizeFor(symbol);
  if (size == null) {
    const pts = Math.abs(close - open);
    return { value: pts ? String(Number(pts.toFixed(2))) : "", points: true };
  }
  const pips = Math.abs(close - open) / size;
  return { value: pips ? String(Number(pips.toFixed(1))) : "", points: false };
}

/** Captured R multiple from combined prices: |close − open| / |open − SL|. */
export function capturedR(open: number, sl: number, close: number): number | null {
  if (![open, sl, close].every(Number.isFinite)) return null;
  const risk = Math.abs(open - sl);
  if (risk <= 0) return null;
  return Math.abs(close - open) / risk;
}

/** Nearest 1–10 RR preset for a captured R, or null when a custom value fits better. */
export function nearestRrPreset(r: number | null): string | null {
  if (r == null || !Number.isFinite(r) || r <= 0) return null;
  const n = Math.round(r);
  if (n >= 1 && n <= 10 && Math.abs(r - n) / n <= 0.15) return String(n);
  return null;
}

/** Suggest a session from the earliest entry hour (UTC). */
export function suggestSession(hourUTC: number): string {
  if (hourUTC >= 6 && hourUTC < 8) return "frankfurt";
  if (hourUTC >= 8 && hourUTC < 13) return "london";
  if (hourUTC >= 13 && hourUTC < 17) return "newyork";
  if (hourUTC >= 17 && hourUTC < 18) return "london-close";
  return "no-window";
}
