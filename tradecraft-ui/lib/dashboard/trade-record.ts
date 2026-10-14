import {
  ALIGNMENTS,
  ENTRIES,
  EXEC_TYPES,
  H4_TREND,
  MODELS,
  PHASES,
  POIS,
  PREV_DAY,
  PSYCH_TAGS,
  SESSIONS,
} from "./trade-options";
import type { ExecutionRow } from "./execution-csv";
import type { NewTradeDraft } from "./trade-options";

export type TradeSource = "demo" | "user";

export type ShotRef = {
  name: string;
  src?: string;
  tvUrl?: string;
  storagePath?: string;
};

/**
 * Canonical trade record — the new-trade entry format shared by the
 * trade log, single-trade view and (once the API lands) the dashboard.
 * Demo trades are generated in this shape; user trades are normalized
 * into it by trade-store.ts.
 */
export type TradeRecord = {
  id: string;
  source: TradeSource;
  pair: string;
  side: "long" | "short";
  outcome: "TP" | "SL" | "BE";
  session: string;
  prevDay: string;
  h4Trend: string;
  phase: string;
  model: string;
  mechanicsContext: string;
  entries: string[];
  execType: string;
  alignment: string;
  pois: string[];
  rr: string;
  rrCustom: string;
  riskPct: string;
  riskCustom: string;
  tradeDate: string;
  inducementTime: string;
  entryTime: string;
  exitTime: string;
  openPrice: number;
  slPrice: number;
  closePrice: number;
  tpPrice: number;
  lots: number;
  pips: number;
  pipsPoints: boolean;
  gross: number;
  swap: number;
  commission: number;
  net: number;
  validity: "valid" | "invalid" | "";
  psychTags: string[];
  psychNote: string;
  notes: string;
  orderIds: string[];
  executions: ExecutionRow[];
  entryShots: ShotRef[];
  tradeShots: ShotRef[];
  thumb: string;
  createdAt: string;
};

function labelOf(
  options: readonly { value: string; label: string }[],
  value: string,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export const modelLabel = (v: string): string => labelOf(MODELS, v);
export const sessionLabel = (v: string): string => labelOf(SESSIONS, v);
export const prevDayLabel = (v: string): string => labelOf(PREV_DAY, v);
export const h4Label = (v: string): string => labelOf(H4_TREND, v);
export const phaseLabel = (v: string): string => labelOf(PHASES, v);
export const execLabel = (v: string): string => labelOf(EXEC_TYPES, v);
export const alignLabel = (v: string): string => labelOf(ALIGNMENTS, v);
export const entryLabels = (vs: string[]): string[] => vs.map((v) => labelOf(ENTRIES, v));
export const poiLabels = (vs: string[]): string[] => vs.map((v) => labelOf(POIS, v));
export const psychLabels = (vs: string[]): string[] => vs.map((v) => labelOf(PSYCH_TAGS, v));

export type TradeResult = "win" | "loss" | "be";

export function recordResult(r: TradeRecord): TradeResult {
  return r.outcome === "TP" ? "win" : r.outcome === "SL" ? "loss" : "be";
}

/** Captured R multiple: preset value, or the custom value. */
export function recordR(r: TradeRecord): number {
  if (r.rr === "custom") return Number(r.rrCustom) || 0;
  const preset = Number(r.rr);
  if (Number.isFinite(preset) && preset > 0)
    return r.outcome === "SL" ? -1 : r.outcome === "BE" ? 0 : preset;
  return 0;
}

export function outcomeTone(o: TradeRecord["outcome"]): "profit" | "loss" | "neutral" {
  return o === "TP" ? "profit" : o === "SL" ? "loss" : "neutral";
}

/** Prefill an editable draft from a stored record (numbers back to strings). */
export function recordToDraft(r: TradeRecord): NewTradeDraft {
  const f = (n: number, dp = 5): string =>
    Number.isFinite(n) ? String(Number(n.toFixed(dp))) : "";
  const auto = r.gross + r.swap + r.commission;
  return {
    pair: r.pair,
    side: r.side,
    orderIds: [...r.orderIds],
    outcome: r.outcome,
    session: r.session,
    prevDay: r.prevDay,
    h4Trend: r.h4Trend,
    phase: r.phase,
    model: r.model,
    mechanicsContext: r.mechanicsContext,
    entries: [...r.entries],
    execType: r.execType,
    alignment: r.alignment,
    pois: [...r.pois],
    rr: r.rr,
    rrCustom: r.rrCustom,
    riskPct: r.riskPct,
    riskCustom: r.riskCustom,
    tradeDate: r.tradeDate,
    inducementTime: r.inducementTime,
    entryTime: r.entryTime,
    exitTime: r.exitTime,
    openPrice: f(r.openPrice),
    slPrice: f(r.slPrice),
    closePrice: f(r.closePrice),
    tpPrice: f(r.tpPrice),
    lots: f(r.lots, 2),
    pips: f(r.pips, 2),
    pipsPoints: r.pipsPoints,
    gross: f(r.gross, 2),
    swap: f(r.swap, 2),
    commission: f(r.commission, 2),
    net: f(r.net, 2),
    netOverride: Math.abs(auto - r.net) > 1e-9,
    sessionAuto: false,
    validity: r.validity,
    psychTags: [...r.psychTags],
    psychNote: r.psychNote,
    notes: r.notes,
  };
}

/** Base price + decimals per pair for demo generation and price formatting. */
export const PAIR_PX: Record<string, { base: number; dp: number }> = {
  EURUSD: { base: 1.085, dp: 5 },
  GBPUSD: { base: 1.322, dp: 5 },
  NQ: { base: 20140, dp: 1 },
  ES: { base: 5820, dp: 1 },
  XAUUSD: { base: 2415, dp: 2 },
  BTCUSD: { base: 85000, dp: 2 },
};

export function priceDp(pair: string): number {
  return PAIR_PX[pair]?.dp ?? 2;
}

/** Candlestick thumbnail SVG (seeded, deterministic). */
export function makeThumb(
  opts: { long: boolean; plan: number; r: number },
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
  const d = opts.long ? -1 : 1;
  const ey = 90;
  const ty = ey + d * u * opts.plan;
  const sy = ey - d * u;
  const tg =
    opts.r > 0
      ? ey + d * u * opts.r
      : ey - d * u * Math.abs(Math.max(opts.r, -1));
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
  return `<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${h}<circle cx="${x1}" cy="${tg}" r="4" fill="${opts.r > 0 ? "var(--profit)" : "var(--loss)"}"/></svg>`;
}
