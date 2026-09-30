/** Shared body/query validators for the resource endpoints. */

export function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

export function asTrimmed(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v.trim() : fallback;
}

export function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

export function asNumber(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Parse an optional numeric input (draft sends strings). Null when absent/blank. */
export function asNullableNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function asBoolean(v: unknown): boolean {
  return v === true;
}

/** Strict YYYY-MM-DD that must be a real calendar date. */
export function isDateString(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  );
}

/** YYYY-MM month selector. */
export function isMonthString(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(v)) return false;
  return true;
}

export type Side = "long" | "short";
export function asSide(v: unknown): Side | null {
  return v === "long" || v === "short" ? v : null;
}

export type Outcome = "TP" | "SL" | "BE";
export function asOutcome(v: unknown): Outcome | null {
  return v === "TP" || v === "SL" || v === "BE" ? v : null;
}

export type Validity = "valid" | "invalid" | "";
export function asValidity(v: unknown): Validity {
  return v === "valid" || v === "invalid" ? v : "";
}

export type ShotKind = "entry" | "trade";
export function asShotKind(v: unknown): ShotKind | null {
  return v === "entry" || v === "trade" ? v : null;
}

/** Grade 1..10, null, or undefined (absent). NaN when invalid. */
export function asGrade(v: unknown): number | null | undefined {
  if (v === null || v === undefined) return v === null ? null : undefined;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 10) return NaN as unknown as null;
  return n;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

export type Period = 7 | 30 | 60 | 90 | 180;
const PERIODS: Period[] = [7, 30, 60, 90, 180];

export function asPeriod(v: unknown, fallback: Period = 30): Period {
  const n = Number(v);
  return (PERIODS as number[]).includes(n) ? (n as Period) : fallback;
}

export function asLimit(v: unknown, fallback = 100): number {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(500, Math.max(1, n));
}

export function asOffset(v: unknown): number {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/**
 * Sanitize an upload filename: basename, safe chars, bounded length.
 * Never returns a path — just a file name.
 */
export function sanitizeFilename(v: unknown): string {
  let name = asTrimmed(v);
  name = name.split("/").pop()?.split("\\").pop() ?? "";
  name = name.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^\.+/, "");
  if (name.length > 120) {
    const dot = name.lastIndexOf(".");
    const ext = dot > 0 ? name.slice(dot) : "";
    name = `${name.slice(0, 120 - ext.length)}${ext}`;
  }
  return name || "image.png";
}
