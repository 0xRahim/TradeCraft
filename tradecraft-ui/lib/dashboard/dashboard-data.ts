export type Period = 7 | 30 | 60 | 90 | 180;
export const PERIODS: Period[] = [7, 30, 60, 90, 180];

export type Kpi = {
  label: string;
  value: string;
  tone: "profit" | "loss" | "";
  delta: string;
  vs: string;
};

export type EquityPoint = { label: string; value: number };

export type CalCell =
  | { kind: "empty" }
  | {
      kind: "day";
      day: number;
      pnl: number;
      intensity: number;
      today: boolean;
    };

export type SessionHour = { h: number; london: number; newyork: number; frankfurt: number };

/**
 * Month grid skeleton (no data — the dashboard overlays live day P&Ls).
 * `today` uses the real current date.
 */
export function buildMonthCells(y: number, m: number): CalCell[] {
  const f = new Date(y, m, 1).getDay();
  const dm = new Date(y, m + 1, 0).getDate();
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const cells: CalCell[] = [];
  for (let i = 0; i < Math.ceil((f + dm) / 7) * 7; i++) {
    const d = i - f + 1;
    if (d < 1 || d > dm) {
      cells.push({ kind: "empty" });
      continue;
    }
    cells.push({
      kind: "day",
      day: d,
      pnl: 0,
      intensity: 0,
      today: `${y}-${m}-${d}` === todayKey,
    });
  }
  return cells;
}
