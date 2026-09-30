import { usdSigned } from "./format";
import { apportion, createRng } from "./seed";

export type Period = 7 | 30 | 60 | 90 | 180;
export const PERIODS: Period[] = [7, 30, 60, 90, 180];

/** 180-point equity series, ported from dashboard.html (seed 7). */
function buildEquity(): number[] {
  const rnd = createRng(7);
  let v = 0;
  const a: number[] = [];
  for (let i = 0; i < 180; i++) {
    v += rnd() - 0.38;
    a.push(v);
  }
  const g = (i: number, j: number) => a[j] - a[i];
  const kA = 9575.5 / g(89, 149);
  const kB = 2905 / g(149, 179);
  return a.map((x, i) =>
    i < 150 ? 25000 + (x - a[89]) * kA : 34575.5 + (x - a[149]) * kB,
  );
}

let equityCache: number[] | null = null;
export function getEquity(): number[] {
  if (!equityCache) equityCache = buildEquity();
  return equityCache;
}

const PD: Record<
  Period,
  { t: number; wr: number; rr: number; d: [string, string, string]; rd: number[] }
> = {
  7: { t: 21, wr: 57.1, rr: 1.94, d: ["+1.2%", "+3", "+0.05R"], rd: [64, 57, 65, 42] },
  30: { t: 44, wr: 61.5, rr: 2.24, d: ["+2.3%", "+5", "+0.11R"], rd: [70, 62, 75, 50] },
  60: { t: 93, wr: 62, rr: 2.29, d: ["+1.4%", "+8", "+0.07R"], rd: [71, 62, 76, 53] },
  90: { t: 148, wr: 62.4, rr: 2.31, d: ["+3.1%", "+12", "+0.18R"], rd: [72, 62, 78, 55] },
  180: { t: 301, wr: 60.8, rr: 2.19, d: ["+0.9%", "+21", "+0.09R"], rd: [68, 61, 73, 58] },
};

export type Kpi = {
  label: string;
  value: string;
  tone: "profit" | "loss" | "";
  delta: string;
  vs: string;
};

export function getKpis(n: Period): Kpi[] {
  const E = getEquity();
  const d = PD[n];
  const net = E[179] - E[179 - n];
  const pc = (net / E[179 - n]) * 100;
  const sn = usdSigned(net);
  return [
    {
      label: "Net P&L",
      value: sn,
      tone: net < 0 ? "loss" : "profit",
      delta: (pc >= 0 ? "+" : "") + pc.toFixed(1) + "%",
      vs: `vs previous ${n} days`,
    },
    {
      label: "Win rate",
      value: d.wr.toFixed(1) + "%",
      tone: "",
      delta: d.d[0],
      vs: `vs previous ${n} days`,
    },
    {
      label: "Trades",
      value: String(d.t),
      tone: "",
      delta: d.d[1],
      vs: `vs previous ${n} days`,
    },
    {
      label: "Average R:R",
      value: "1:" + d.rr.toFixed(2),
      tone: "",
      delta: d.d[2],
      vs: `vs previous ${n} days`,
    },
  ];
}

export type EquityPoint = { label: string; value: number };

export function getEquitySlice(n: Period): EquityPoint[] {
  const E = getEquity();
  const D = E.slice(-n);
  const o = E.length - n;
  return D.map((value, k) => ({
    label: new Date(2026, 8, k + o - 150).toLocaleDateString("en", {
      month: "short",
      day: "numeric",
    }),
    value,
  }));
}

/* P&L calendar */

const SEP = [
  -180, 240, 35, 520, 780, -40, -410, -90, -260, 310, 95, -120, -210, 470,
  -320, -30, 260, 610, 90, -140, 380, 690, -150, -95, 420, -110, 240, -80, 0,
];

export type CalCell =
  | { kind: "empty" }
  | {
      kind: "day";
      day: number;
      pnl: number;
      intensity: number;
      today: boolean;
    };

export type CalMonth = {
  cells: CalCell[];
  total: number;
  wins: number;
  losses: number;
  best: number;
};

export function getCalendarMonth(y: number, m: number): CalMonth {
  const f = new Date(y, m, 1).getDay();
  const dm = new Date(y, m + 1, 0).getDate();
  const now = new Date(2026, 8, 29);
  const rnd = createRng(y * 12 + m);
  for (let i = 0; i < 8; i++) rnd();
  const cells: CalCell[] = [];
  let tot = 0;
  let w = 0;
  let l = 0;
  let best = -1e9;
  for (let i = 0; i < Math.ceil((f + dm) / 7) * 7; i++) {
    const d = i - f + 1;
    if (d < 1 || d > dm) {
      cells.push({ kind: "empty" });
      continue;
    }
    const dt = new Date(y, m, d);
    let p = 0;
    if (dt <= now) {
      if (y === 2026 && m === 8) p = SEP[d - 1];
      else if (i % 7 > 0 && i % 7 < 6 && rnd() < 0.8)
        p =
          Math.round(
            (rnd() < 0.6 ? 60 + rnd() * 900 : -(40 + rnd() * 500)) / 10,
          ) * 10;
    }
    tot += p;
    if (p > 0) w++;
    if (p < 0) l++;
    best = Math.max(best, p);
    cells.push({
      kind: "day",
      day: d,
      pnl: p,
      intensity: Math.min(Math.abs(p) / 800, 1),
      today: +dt === +now,
    });
  }
  return { cells, total: tot, wins: w, losses: l, best };
}

/* Radar */

export function getRadar(n: Period): { axis: string; score: number }[] {
  const q = PD[n].rd;
  return [
    { axis: "Consistency", score: q[0] },
    { axis: "Win rate", score: q[1] },
    { axis: "Risk-reward", score: q[2] },
    { axis: "Frequency", score: q[3] },
  ];
}

/* Distributions */

const TM = [
  "London reversal",
  "New York reversal",
  "London SMT cont.",
  "New York SMT cont.",
  "Asia 50% cont.",
  "USD news",
  "Market mechanics",
];
const TB = [38, 30, 24, 20, 14, 12, 10];
const EM = ["BOS", "SMT", "I.BOS", "M5 engulfing", "B&T", "2LP"];
const EB = [40, 32, 26, 22, 18, 10];

export function getTradeModels(n: Period): { name: string; count: number }[] {
  const counts = apportion(TB, PD[n].t);
  return TM.map((name, i) => ({ name, count: counts[i] }));
}

export function getEntryModels(n: Period): { name: string; count: number }[] {
  const counts = apportion(EB, PD[n].t);
  return EM.map((name, i) => ({ name, count: counts[i] }));
}

export function getPeriodTradeCount(n: Period): number {
  return PD[n].t;
}

// TODO(api): derive KPIs, models, entries and sessions from the trade store
// once user trades sync to the backend. Demo distributions below use the
// new entry-form taxonomy (condition models, entry models, sessions).

const LO = [4, 8, 11, 12, 9, 7, 4, 2, 1];
const NY = [6, 14, 18, 16, 12, 10, 7, 4, 3];
const FR = [2, 5, 8, 9, 6, 4, 2, 1];

export type SessionHour = { h: number; london: number; newyork: number; frankfurt: number };

export function getSessions(n: Period): {
  hours: SessionHour[];
  london: number;
  newyork: number;
  frankfurt: number;
} {
  const t = PD[n].t;
  const lo = Math.round((t * 58) / 148);
  const fr = Math.round((t * 22) / 148);
  const a = apportion(LO, lo);
  const b = apportion(NY, t - lo - fr);
  const c = apportion(FR, fr);
  const hours: SessionHour[] = Array.from({ length: 24 }, (_, h) => ({
    h,
    london: a[h - 7] || 0,
    newyork: b[h - 12] || 0,
    frankfurt: c[h - 6] || 0,
  }));
  return { hours, london: lo, newyork: t - lo - fr, frankfurt: fr };
}
