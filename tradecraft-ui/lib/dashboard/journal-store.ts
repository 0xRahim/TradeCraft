export type JournalFile = { id: string; n: string; b: string };
export type JournalDay = {
  g: number | null;
  o: string;
  files: JournalFile[];
};
export type JournalData = Record<string, JournalDay>;

export const JOURNAL_KEY = "tradecraft.journal.v1";
/** Pre-rename key — read once for migration, then abandoned. */
export const LEGACY_JOURNAL_KEY = "tradeeye.journal.v1";

/** Real current date (local timezone), YYYY-MM-DD. */
export function todayKey(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function loadJournal(): JournalData {
  if (typeof window === "undefined") return {};
  try {
    const raw =
      window.localStorage.getItem(JOURNAL_KEY) ??
      window.localStorage.getItem(LEGACY_JOURNAL_KEY);
    if (raw) {
      const data = JSON.parse(raw) as JournalData;
      // One-time migration off the pre-rename key.
      if (!window.localStorage.getItem(JOURNAL_KEY)) {
        try {
          window.localStorage.setItem(JOURNAL_KEY, raw);
          window.localStorage.removeItem(LEGACY_JOURNAL_KEY);
        } catch {
          /* storage unavailable */
        }
      }
      return data;
    }
  } catch {
    /* fall through to empty */
  }
  return {};
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
