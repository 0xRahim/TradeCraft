import { createRng, pick } from "./seed";

export type Trade = {
  id: number;
  date: string;
  time: string;
  tk: string;
  md: string;
  side: "L" | "S";
  plan: number;
  r: number;
  pnl: number;
  risk: number;
  note: string;
  thumb: string;
};

export const TICKERS = ["EURUSD", "GBPUSD", "NQ", "ES", "XAUUSD", "BTCUSD"];
export const MODELS = [
  "Silver Bullet",
  "Breaker Block",
  "ICT 2022 Model",
  "Turtle Soup",
  "Opening Range",
  "Judas Swing",
];
const NOTES = [
  "Waited for the sweep, entered on the FVG retest.",
  "HTF bias aligned. Stop under the swing, target at the previous high.",
  "Took partials at 1R and moved stop to breakeven.",
  "Entry was late; the move was mostly done.",
  "Clean execution, followed the checklist.",
  "Rule break: sized up after a loss.",
];

/** Candlestick thumbnail SVG, ported from trades.html (seeded, deterministic). */
function thumbSvg(
  t: { side: "L" | "S"; plan: number; r: number },
  rnd: () => number,
): string {
  let h =
    '<rect width="320" height="180" fill="var(--background)"/>' +
    [45, 90, 135]
      .map(
        (y) =>
          `<line x1="0" x2="320" y1="${y}" y2="${y}" stroke="var(--surface-highest)"/>`,
      )
      .join("");
  const u = 14;
  const d = t.side === "L" ? -1 : 1;
  const ey = 90;
  const ty = ey + d * u * t.plan;
  const sy = ey - d * u;
  const tg =
    t.r > 0 ? ey + d * u * t.r : ey - d * u * Math.abs(Math.max(t.r, -1));
  const x0 = 133;
  const x1 = 278;
  h += `<rect x="${x0}" y="${Math.min(ey, ty)}" width="${x1 - x0}" height="${Math.abs(ty - ey)}" fill="rgba(34,197,94,.14)"/><rect x="${x0}" y="${Math.min(ey, sy)}" width="${x1 - x0}" height="${u}" fill="rgba(255,100,103,.14)"/><line x1="${x0}" x2="${x1}" y1="${ey}" y2="${ey}" stroke="var(--ring)" stroke-dasharray="3 3"/>`;
  let y = ey + (rnd() - 0.5) * 16;
  for (let i = 0; i < 30; i++) {
    const o = y;
    let c: number;
    if (i < 12) c = ey + (rnd() - 0.5) * 22 + (11 - i) * 0;
    else if (i < 26)
      c = ey + (tg - ey) * Math.min(1, (i - 11) / 12) + (rnd() - 0.5) * 10;
    else c = tg + (rnd() - 0.5) * 8;
    c = Math.max(10, Math.min(170, c));
    if (i === 11) c = ey;
    const hi = Math.min(o, c) - rnd() * 7;
    const lo = Math.max(o, c) + rnd() * 7;
    const x = 10 + i * 10.4;
    const up = c < o;
    h += `<line x1="${x}" x2="${x}" y1="${hi}" y2="${lo}" stroke="${up ? "var(--chart-1)" : "var(--chart-4)"}"/><rect x="${x - 3}" y="${Math.min(o, c)}" width="6" height="${Math.max(1.5, Math.abs(o - c))}" fill="${up ? "var(--chart-1)" : "var(--chart-4)"}"/>`;
    y = c;
  }
  return `<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${h}<circle cx="${x1}" cy="${tg}" r="4" fill="${t.r > 0 ? "var(--profit)" : "var(--loss)"}"/></svg>`;
}

function buildTrades(): Trade[] {
  const rnd = createRng(11);
  const out: Trade[] = [];
  const dd = new Date(2026, 7, 3);
  const end = new Date(2026, 8, 29);
  while (dd <= end) {
    const w = dd.getDay();
    if (w !== 0 && w !== 6) {
      const n = rnd() < 0.25 ? 0 : rnd() < 0.5 ? 1 : rnd() < 0.8 ? 2 : 3;
      for (let i = 0; i < n; i++) {
        const win = rnd() < 0.6;
        const plan = pick(rnd, [2, 3, 4]);
        const r = win
          ? Math.max(0.5, Math.round(plan * (0.5 + rnd() * 0.6) * 10) / 10)
          : rnd() < 0.8
            ? -1
            : -Math.round((0.3 + rnd() * 0.5) * 10) / 10;
        const risk = 100 + 50 * Math.floor(rnd() * 4);
        const h =
          rnd() < 0.4 ? 7 + Math.floor(rnd() * 4) : 13 + Math.floor(rnd() * 4);
        const mi = Math.floor(rnd() * 60);
        const t = {
          id: out.length,
          date: `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}-${String(dd.getDate()).padStart(2, "0")}`,
          time: `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`,
          tk: pick(rnd, TICKERS),
          md: pick(rnd, MODELS),
          side: (rnd() < 0.55 ? "L" : "S") as "L" | "S",
          plan,
          r,
          pnl: Math.round(r * risk),
          risk,
          note: pick(rnd, NOTES),
          thumb: "",
        };
        t.thumb = thumbSvg(t, rnd);
        out.push(t);
      }
    }
    dd.setDate(dd.getDate() + 1);
  }
  return out;
}

let cache: Trade[] | null = null;

/** All demo trades, deterministic (same seed as the samples). */
export function getTrades(): Trade[] {
  if (!cache) cache = buildTrades();
  return cache;
}

export function getTrade(id: number): Trade | undefined {
  return getTrades().find((t) => t.id === id);
}
