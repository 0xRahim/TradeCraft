export function usdSigned(n: number): string {
  return (
    (n < 0 ? "-" : "+") +
    "$" +
    Math.abs(n).toLocaleString("en", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function usdWhole(n: number): string {
  return (
    (n < 0 ? "-" : "+") + "$" + Math.abs(n).toLocaleString("en")
  );
}

/** Signed R multiple, e.g. +2.4R / -1.0R */
export function rSigned(r: number): string {
  return (
    (r > 0 ? "+" : r < 0 ? "-" : "") + Math.abs(r).toFixed(1) + "R"
  );
}

/** Signed plain P&L, e.g. +520 / -410 */
export function pnlSigned(p: number): string {
  return (p > 0 ? "+" : p < 0 ? "-" : "") + Math.abs(p).toLocaleString("en");
}

export function pnlTone(n: number): "profit" | "loss" | "" {
  return n > 0 ? "profit" : n < 0 ? "loss" : "";
}

export function monthDay(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}

export function monthDayYear(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function monthYear(y: number, m: number): string {
  return new Date(y, m).toLocaleDateString("en", {
    month: "short",
    year: "numeric",
  });
}

export function monthLongYear(y: number, m: number): string {
  return new Date(y, m).toLocaleDateString("en", {
    month: "long",
    year: "numeric",
  });
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
