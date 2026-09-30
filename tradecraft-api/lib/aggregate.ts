import { capturedR } from "./trades-map.js";

/**
 * Dashboard aggregation over a user's trades.
 *
 * Formulas (finalized — mirrors API.md):
 * - Scope: rows with a `trade_date` inside the trailing `period`-day window
 *   (UTC dates, inclusive). Rows without a date are excluded from metrics
 *   but still appear in the trade log.
 * - Win rate = TP / (TP + SL); BE excluded; `invalid` validity included.
 * - Net = sum(net). Equity = cumulative net per trade_date + `anchor`.
 * - Deltas compare against the preceding equal-length window.
 * - Radar (heuristic): Consistency = green-day ratio; Win rate; Risk-reward
 *   = avgR / 3; Frequency = trades / period × 50 — all clamped 0–100.
 */

export type AggTrade = {
  tradeDate: string | null;
  outcome: string;
  net: number;
  rr: string;
  rrCustom: string;
  model: string;
  entries: string[];
  session: string;
  entryTime: string;
};

export type DashboardResult = {
  period: number;
  kpis: { label: string; value: string; tone: string; delta: string; vs: string }[];
  equity: { label: string; value: number }[];
  calendar: {
    month: string;
    total: number;
    wins: number;
    losses: number;
    best: number;
    days: { date: string; pnl: number }[];
  };
  tradeModels: { name: string; count: number }[];
  entryModels: { name: string; count: number }[];
  sessions: {
    hours: { h: number; london: number; frankfurt: number; newyork: number }[];
    london: number;
    frankfurt: number;
    newyork: number;
  };
  radar: { axis: string; score: number }[];
  tradeCount: number;
};

const DAY_MS = 86_400_000;

function toDayNumber(dateStr: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const ms = Date.parse(`${dateStr}T00:00:00Z`);
  if (!Number.isFinite(ms)) return null;
  return Math.floor(ms / DAY_MS);
}

function dayLabel(dayNum: number): string {
  const d = new Date(dayNum * DAY_MS);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function usdSigned(n: number): string {
  const abs = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${n < 0 ? "-" : "+"}$${abs}`;
}

function fmtSigned(n: number, digits: number, suffix: string): string {
  const sign = n < 0 ? "-" : "+";
  return `${sign}${Math.abs(n).toFixed(digits)}${suffix}`;
}

function winRateOf(trades: AggTrade[]): number {
  const tp = trades.filter((t) => t.outcome === "TP").length;
  const sl = trades.filter((t) => t.outcome === "SL").length;
  if (tp + sl === 0) return 0;
  return (tp / (tp + sl)) * 100;
}

function avgROf(trades: AggTrade[]): number {
  if (trades.length === 0) return 0;
  const sum = trades.reduce(
    (acc, t) =>
      acc +
      capturedR({ rr: t.rr, rrCustom: t.rrCustom, outcome: t.outcome }),
    0,
  );
  return sum / trades.length;
}

function netOf(trades: AggTrade[]): number {
  return round2(trades.reduce((acc, t) => acc + (Number(t.net) || 0), 0));
}

function countBy(values: string[]): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || (a.name < b.name ? -1 : 1));
}

export function computeDashboard(
  allTrades: AggTrade[],
  period: number,
  month: string,
  anchor: number,
  todayStr?: string,
): DashboardResult {
  let todayNum = Math.floor(Date.now() / DAY_MS);
  if (todayStr) {
    const parsed = toDayNumber(todayStr);
    if (parsed !== null) todayNum = parsed;
  }
  const start = todayNum - (period - 1);
  const prevStart = todayNum - (2 * period - 1);
  const prevEnd = todayNum - period;

  const dated: { t: AggTrade; day: number }[] = [];
  for (const t of allTrades) {
    if (!t.tradeDate) continue;
    const day = toDayNumber(t.tradeDate);
    if (day === null) continue;
    dated.push({ t, day });
  }
  const inWindow = dated
    .filter((d) => d.day >= start && d.day <= todayNum)
    .map((d) => d.t);
  const inPrev = dated
    .filter((d) => d.day >= prevStart && d.day <= prevEnd)
    .map((d) => d.t);

  const vs = `vs previous ${period} days`;
  const net = netOf(inWindow);
  const prevNet = netOf(inPrev);
  const netPct = prevNet !== 0 ? (net / Math.abs(prevNet)) * 100 : 0;
  const wr = winRateOf(inWindow);
  const prevWr = winRateOf(inPrev);
  const avgR = avgROf(inWindow);
  const prevAvgR = avgROf(inPrev);

  const kpis: DashboardResult["kpis"] = [
    {
      label: "Net P&L",
      value: usdSigned(net),
      tone: net < 0 ? "loss" : "profit",
      delta: fmtSigned(netPct, 1, "%"),
      vs,
    },
    {
      label: "Win rate",
      value: `${wr.toFixed(1)}%`,
      tone: "",
      delta: fmtSigned(wr - prevWr, 1, "%"),
      vs,
    },
    {
      label: "Trades",
      value: String(inWindow.length),
      tone: "",
      delta: fmtSigned(inWindow.length - inPrev.length, 0, ""),
      vs,
    },
    {
      label: "Average R:R",
      value: `1:${avgR.toFixed(2)}`,
      tone: "",
      delta: fmtSigned(avgR - prevAvgR, 2, "R"),
      vs,
    },
  ];

  // Equity: cumulative net per trade_date, ascending, anchored.
  const byDay = new Map<number, number>();
  for (const { t, day } of dated.filter((d) => d.day <= todayNum)) {
    if (day < start) continue;
    byDay.set(day, round2((byDay.get(day) ?? 0) + (Number(t.net) || 0)));
  }
  const equity: DashboardResult["equity"] = [];
  let running = anchor;
  for (const day of [...byDay.keys()].sort((a, b) => a - b)) {
    running = round2(running + (byDay.get(day) ?? 0));
    equity.push({ label: dayLabel(day), value: running });
  }

  // Calendar: group the requested month's trades by date.
  const calDays: { date: string; pnl: number }[] = [];
  let calTotal = 0;
  let calWins = 0;
  let calLosses = 0;
  let calBest = 0;
  {
    const perDate = new Map<string, number>();
    for (const { t } of dated) {
      if (!t.tradeDate || !t.tradeDate.startsWith(`${month}-`)) continue;
      perDate.set(
        t.tradeDate,
        round2((perDate.get(t.tradeDate) ?? 0) + (Number(t.net) || 0)),
      );
    }
    for (const date of [...perDate.keys()].sort()) {
      const pnl = perDate.get(date) ?? 0;
      calDays.push({ date, pnl });
      calTotal = round2(calTotal + pnl);
      if (pnl > 0) calWins += 1;
      if (pnl < 0) calLosses += 1;
      if (pnl > calBest) calBest = pnl;
    }
  }

  const tradeModels = countBy(inWindow.map((t) => t.model));
  const entryModels = countBy(inWindow.flatMap((t) => t.entries));

  // Sessions: known windows only (others stay in tradeCount).
  const inSession = (s: string, want: string): boolean => s === want;
  const london = inWindow.filter((t) => inSession(t.session, "london")).length;
  const frankfurt = inWindow.filter((t) =>
    inSession(t.session, "frankfurt"),
  ).length;
  const newyork = inWindow.filter((t) => inSession(t.session, "newyork")).length;
  const hours: DashboardResult["sessions"]["hours"] = [];
  for (let h = 0; h < 24; h += 1) {
    hours.push({ h, london: 0, frankfurt: 0, newyork: 0 });
  }
  for (const t of inWindow) {
    const m = /^(\d{1,2}):/.exec(t.entryTime);
    if (!m) continue;
    const h = Number(m[1]);
    if (!Number.isInteger(h) || h < 0 || h > 23) continue;
    if (t.session === "london" && h >= 7 && h <= 15) hours[h].london += 1;
    else if (t.session === "frankfurt" && h >= 6 && h <= 13)
      hours[h].frankfurt += 1;
    else if (t.session === "newyork" && h >= 12 && h <= 20)
      hours[h].newyork += 1;
  }

  // Radar heuristic.
  const dayPnls = [...byDay.values()];
  const greenDays = dayPnls.filter((p) => p >= 0).length;
  const consistency =
    dayPnls.length === 0 ? 0 : Math.round((greenDays / dayPnls.length) * 100);
  const radar: DashboardResult["radar"] = [
    { axis: "Consistency", score: consistency },
    { axis: "Win rate", score: Math.round(wr) },
    {
      axis: "Risk-reward",
      score: Math.max(0, Math.min(100, Math.round((avgR / 3) * 100))),
    },
    {
      axis: "Frequency",
      score: Math.max(
        0,
        Math.min(100, Math.round((inWindow.length / period) * 50)),
      ),
    },
  ];

  return {
    period,
    kpis,
    equity,
    calendar: {
      month,
      total: calTotal,
      wins: calWins,
      losses: calLosses,
      best: calBest,
      days: calDays,
    },
    tradeModels,
    entryModels,
    sessions: { hours, london, frankfurt, newyork },
    radar,
    tradeCount: inWindow.length,
  };
}
