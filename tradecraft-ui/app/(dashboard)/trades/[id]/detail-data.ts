export type TradeResult = "win" | "loss" | "be";
export type TradeDir = "bull" | "bear";

export type DetailTrade = {
  id: string;
  tk: string;
  date: string;
  time: string;
  dir: TradeDir;
  res: TradeResult;
  md: string;
  cond: "ptr" | "ctr" | "ptc" | "ctc";
  mkt: "bal" | "imb" | "rng";
  sess: string;
  risk: number;
  unit: string;
  pv: number;
  dp: number;
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  em: string;
  size: number;
  su: string;
  oid: number;
  seed: number;
  sum: string;
  note: string;
};

export const DETAIL_TRADES: DetailTrade[] = [
  {
    id: "t1",
    tk: "EURUSD",
    date: "2026-09-28",
    time: "08:42",
    dir: "bull",
    res: "win",
    md: "Silver Bullet",
    cond: "ptc",
    mkt: "imb",
    sess: "London",
    risk: 200,
    unit: "pips",
    pv: 0.0001,
    dp: 5,
    entry: 1.0842,
    sl: 8,
    tp1: 16,
    tp2: 24,
    em: "FVG retest · 5m",
    size: 2,
    su: "lots",
    oid: 48213907,
    seed: 11,
    sum: "Swept the London high, displaced lower into the daily FVG, entered on the retest.",
    note: "HTF bias was bullish and price tapped a 4H discount array. Waited for the sweep of Asia low, then the 5m displacement.\n\nTook 50% at TP1 (2R), moved stop to breakeven, runner hit TP2.\n\nWhat I would repeat: waiting for the window instead of forcing an entry.",
  },
  {
    id: "t2",
    tk: "NQ",
    date: "2026-09-24",
    time: "09:34",
    dir: "bear",
    res: "loss",
    md: "Breaker Block",
    cond: "ctr",
    mkt: "bal",
    sess: "New York",
    risk: 200,
    unit: "pts",
    pv: 1,
    dp: 1,
    entry: 20140,
    sl: 40,
    tp1: 40,
    tp2: 80,
    em: "Breaker retest · 5m",
    size: 2,
    su: "contracts",
    oid: 51780240,
    seed: 23,
    sum: "Counter trend short into a 4H bearish order block. Stopped out.",
    note: "Counter trend idea against a strong 4H bullish order block. I saw the warning and took it anyway.\n\nRule for next time: no counter trend entries without a 1H structure shift.",
  },
  {
    id: "t3",
    tk: "XAUUSD",
    date: "2026-09-23",
    time: "07:55",
    dir: "bull",
    res: "be",
    md: "Judas Swing",
    cond: "ptr",
    mkt: "rng",
    sess: "London",
    risk: 200,
    unit: "pips",
    pv: 0.1,
    dp: 2,
    entry: 2415,
    sl: 50,
    tp1: 100,
    tp2: 150,
    em: "Sweep + reclaim · 5m",
    size: 0.5,
    su: "lots",
    oid: 39902114,
    seed: 37,
    sum: "Range day. Reached 1R, stop moved to breakeven and was tagged.",
    note: "Choppy range, no expansion after London. Correctly moved to breakeven at 1R.\n\nCould have skipped this one: no clear draw on liquidity.",
  },
];

export const CONDITIONS: Record<DetailTrade["cond"], string> = {
  ptr: "Pro trend reversal",
  ctr: "Counter trend reversal",
  ptc: "Pro trend continuation",
  ctc: "Counter trend continuation",
};

export const MARKETS: Record<DetailTrade["mkt"], string> = {
  bal: "Balance",
  imb: "Imbalance",
  rng: "Range",
};

export const RESULT_LABELS: Record<TradeResult, string> = {
  win: "Win",
  loss: "Loss",
  be: "Breakeven",
};

export const TRADE_OVERRIDES_KEY = "tradeeye.trade.v1";
export type TradeOverrides = Partial<
  Pick<DetailTrade, "res" | "dir" | "cond" | "mkt" | "note" | "sum">
>;

const sg = (t: DetailTrade) => (t.dir === "bull" ? 1 : -1);

export function tradeLevels(t: DetailTrade): {
  sl: string;
  tp1: string;
  tp2: string;
  en: string;
} {
  const f = (p: number) => (t.entry + sg(t) * p * t.pv).toFixed(t.dp);
  return { sl: f(-t.sl), tp1: f(t.tp1), tp2: f(t.tp2), en: t.entry.toFixed(t.dp) };
}

export function tradeR(t: DetailTrade): number {
  return t.res === "win" ? (t.tp1 + t.tp2) / 2 / t.sl : t.res === "loss" ? -1 : 0;
}

export function tradePnl(t: DetailTrade): number {
  return Math.round(tradeR(t) * t.risk);
}

export function addMinutes(s: string, m: number): string {
  let [h, n] = s.split(":").map(Number);
  n += m;
  h += Math.floor(n / 60);
  n %= 60;
  return String(h).padStart(2, "0") + ":" + String(n).padStart(2, "0");
}

/** Setup/entry/result chart SVG, ported from trade.html (theme-aware). */
export function tradeChart(t: DetailTrade, v: 0 | 1 | 2): string {
  let sd = (((t.seed + v * 5) * 48271) % 2147483647 + 2147483647) % 2147483647;
  const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const d = -sg(t);
  const u = 14;
  const ey = 90;
  const N = [44, 30, 30][v];
  const ent = [N, 20, 12][v];
  const sx = 296 / N;
  const X = (i: number) => 12 + i * sx;
  const py = u / t.sl;
  const end =
    t.res === "win" ? ey + d * py * t.tp2 : t.res === "loss" ? ey - d * u : ey;
  let h =
    '<rect width="320" height="180" fill="var(--background)"/>' +
    [45, 90, 135]
      .map(
        (y) =>
          `<line x1="0" x2="320" y1="${y}" y2="${y}" stroke="var(--surface-highest)"/>`,
      )
      .join("");
  let y = ey - d * (v ? ent : N) * 1.1;
  const n = v === 1 ? ent + 1 : N;
  if (v) {
    const x0 = X(ent);
    const x1 = 316;
    const ty = ey + d * py * t.tp2;
    const t1 = ey + d * py * t.tp1;
    h +=
      `<rect x="${x0}" y="${Math.min(ey, ty)}" width="${x1 - x0}" height="${Math.abs(ty - ey)}" fill="rgba(34,197,94,.14)"/>` +
      `<rect x="${x0}" y="${Math.min(ey, ey - d * u)}" width="${x1 - x0}" height="${u}" fill="rgba(255,100,103,.14)"/>` +
      `<line x1="${x0}" x2="${x1}" y1="${ey}" y2="${ey}" stroke="var(--ring)" stroke-dasharray="3 3"/>` +
      `<line x1="${x0}" x2="${x1}" y1="${t1}" y2="${t1}" stroke="rgba(74,222,128,.5)" stroke-dasharray="2 3"/>` +
      (
        [
          ["TP2", ty],
          ["TP1", t1],
          ["ENTRY", ey],
          ["SL", ey - d * u],
        ] as const
      )
        .map(
          (a) =>
            `<text x="${x1 - 2}" y="${a[1] - 3}" text-anchor="end" font-size="7" fill="var(--on-surface-variant)" font-family="monospace">${a[0]}</text>`,
        )
        .join("");
  } else {
    h +=
      `<rect x="${X(N - 9)}" y="${ey - 12}" width="${sx * 9 + 8}" height="24" fill="rgba(250,250,250,.05)" stroke="var(--input)"/>` +
      `<text x="${X(N - 9) + 4}" y="${ey - 16}" font-size="7" fill="var(--subtle-foreground)" font-family="monospace">POI</text>`;
  }
  for (let i = 0; i < n; i++) {
    const o = y;
    let c: number;
    if (v === 0) c = ey - d * (N - i) * 1.1 + (r() - 0.5) * 12;
    else if (i < ent) c = ey - d * (ent - i) * 1.1 + (r() - 0.5) * 10;
    else {
      const p = (i - ent) / (N - 1 - ent);
      c =
        t.res === "be"
          ? ey + d * u * 1.1 * Math.sin(Math.PI * p)
          : ey + (end - ey) * Math.min(1, p * 1.15);
    }
    c += i >= ent && v ? (r() - 0.5) * 6 : 0;
    if (i === ent && v) c = ey;
    c = Math.max(10, Math.min(170, c));
    const hi = Math.min(o, c) - r() * 6;
    const lo = Math.max(o, c) + r() * 6;
    const up = c < o;
    const x = X(i);
    const k = up ? "var(--chart-1)" : "var(--chart-4)";
    h += `<line x1="${x}" x2="${x}" y1="${hi}" y2="${lo}" stroke="${k}"/><rect x="${x - 2.5}" y="${Math.min(o, c)}" width="5" height="${Math.max(1.5, Math.abs(o - c))}" fill="${k}"/>`;
    y = c;
  }
  if (v === 2)
    h += `<circle cx="${X(N - 1)}" cy="${y}" r="4" fill="${t.res === "win" ? "var(--profit)" : t.res === "loss" ? "var(--loss)" : "var(--chart-3)"}"/>`;
  return `<svg viewBox="0 0 320 180" aria-hidden="true">${h}<text x="8" y="12" font-size="8" fill="var(--subtle-foreground)" font-family="monospace">${t.tk} · ${["4H", "5m · Entry", "5m · Result"][v]}</text></svg>`;
}
