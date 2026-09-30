export type JournalFile = { id: string; n: string; b: string };
export type JournalDay = {
  g: number | null;
  o: string;
  files: JournalFile[];
};
export type JournalData = Record<string, JournalDay>;

export const JOURNAL_KEY = "tradeeye.journal.v1";
export const TODAY = "2026-09-29";

export function seedJournal(): JournalData {
  const d: JournalData = {};
  let c = 0;
  const add = (
    dt: string,
    g: number | null,
    o: string,
    ...files: [string, string][]
  ) => {
    d[dt] = {
      g,
      o,
      files: files.map(([n, b]) => ({ id: "f" + c++, n, b })),
    };
  };
  add(
    "2026-09-29",
    null,
    "pending",
    [
      "nq-premarket-thesis",
      `# NQ · Premarket thesis

**Bias:** bullish while price holds above the Asia low.

## Levels
- Draw on liquidity: previous day high
- Entry zone: 15m FVG after the London sweep

## Checklist
- [x] HTF bias confirmed
- [ ] Session liquidity marked
- [ ] News window clear`,
    ],
  );
  add(
    "2026-09-28",
    8,
    "played",
    [
      "eurusd-ny-am",
      `# EURUSD · NY AM

Expected a sweep of the London high, then displacement lower.

> Played out: sweep at 8:42, entry on the 5m FVG.

## Review
- Followed the plan, took **2.4R**
- Could have held partials longer`,
    ],
  );
  add(
    "2026-09-25",
    9,
    "played",
    [
      "silver-bullet-review",
      `# Silver Bullet · Review

A-grade day. Waited for the 10:00 window and only took the FVG entry.

- **R:R:** 1:3.1
- **Mistakes:** none

## Lesson
Patience beats frequency.`,
    ],
    [
      "weekly-outlook",
      `# Weekly outlook

HTF bullish, look for discount entries.

1. Monday: accumulation
2. Midweek: expansion
3. Friday: take profit`,
    ],
  );
  add(
    "2026-09-24",
    4,
    "invalid",
    [
      "nq-thesis",
      `# NQ · Thesis

Expected continuation long. Price took the low instead.

> Invalidated: I ignored the 4H bearish order block.

## Lessons
- Check the 4H POI before entering
- Skip trades against HTF bias`,
    ],
  );
  add(
    "2026-09-23",
    6,
    "played",
    [
      "range-day-notes",
      `# Range day

Choppy Asia, no clear draw. Took one scalp, small loss.

- Should have stayed flat until London`,
    ],
  );
  add(
    "2026-09-22",
    9,
    "played",
    [
      "breaker-block-thesis",
      `# Breaker block thesis

Price swept sell-side liquidity into a 1H breaker. Entry on the retest, stop below the swing.

- [x] Entry model matched
- [x] Risk under 1%`,
    ],
    [
      "trade-review",
      `# Trade review

Target hit at the previous week high. **+3.4R**, clean execution.`,
    ],
  );
  add(
    "2026-09-21",
    7,
    "played",
    [
      "gbpusd-thesis",
      `# GBPUSD · Thesis

Bullish above the weekly open. Partial at 1R, runner to the high.`,
    ],
  );
  add(
    "2026-09-18",
    3,
    "invalid",
    [
      "fomo-day",
      `# FOMO day

Chased a move after missing the entry. Three trades outside the plan.

> Rule: no entries without a marked level.`,
    ],
  );
  add(
    "2026-09-17",
    8,
    "played",
    [
      "london-thesis",
      `# London thesis

Judas swing above Asia high, then reversal. Waited for confirmation.`,
    ],
  );
  add(
    "2026-09-16",
    5,
    "played",
    [
      "opening-range-notes",
      `# Opening range

Entry was fine, exit was early. Left 1.5R on the table.`,
    ],
  );
  add(
    "2026-08-29",
    7,
    "played",
    [
      "eurusd-friday",
      `# EURUSD · Friday

Reduced size into the weekend. Took profit at the daily level.`,
    ],
  );
  add(
    "2026-08-28",
    6,
    "played",
    [
      "ny-reversal-idea",
      `# NY reversal idea

Idea was right, timing was late. Entered after most of the move.`,
    ],
  );
  add(
    "2026-08-27",
    8,
    "played",
    [
      "turtle-soup-setup",
      `# Turtle soup setup

Sweep of the 20-day low, reclaimed within the hour. Entry on the reclaim.`,
    ],
  );
  return d;
}

export function loadJournal(): JournalData {
  if (typeof window === "undefined") return seedJournal();
  try {
    const raw = window.localStorage.getItem(JOURNAL_KEY);
    if (raw) return JSON.parse(raw) as JournalData;
  } catch {
    /* fall through to seed */
  }
  return seedJournal();
}

export function saveJournal(data: JournalData): void {
  try {
    window.localStorage.setItem(JOURNAL_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
}

export function gradeTone(g: number): "profit" | "warning" | "loss" {
  return g >= 7 ? "profit" : g >= 5 ? "warning" : "loss";
}

export function gradeLabel(g: number | null): string {
  if (!g) return "Not graded";
  if (g >= 9) return "Excellent";
  if (g >= 7) return "Good";
  if (g >= 5) return "Average";
  if (g >= 3) return "Weak";
  return "Poor";
}
