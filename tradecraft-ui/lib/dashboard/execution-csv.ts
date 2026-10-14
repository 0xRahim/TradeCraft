export type ExecutionRow = {
  id: string;
  symbol: string;
  openTime: string;
  volume: number;
  side: string;
  closeTime: string;
  openPrice: number;
  closePrice: number;
  stopLoss: number;
  takeProfit: number;
  swap: number;
  commission: number;
  profit: number;
  reason: string;
};

const num = (v: string): number => {
  const n = Number(String(v ?? "").replace(/[\s,]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (c === "," && !quoted) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out.map((s) =>
    s.startsWith('"') && s.endsWith('"') ? s.slice(1, -1) : s,
  );
}

/** Parse the broker execution-history export into typed rows. Skips the trailing Total row. */
export function parseExecutionCsv(text: string): ExecutionRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const rows: ExecutionRow[] = [];
  for (const line of lines.slice(1)) {
    const c = splitCsvLine(line);
    if (!c.length) continue;
    const id = (c[0] ?? "").trim();
    if (!id || /^total$/i.test(id)) continue;
    rows.push({
      id,
      symbol: (c[1] ?? "").trim(),
      openTime: (c[2] ?? "").trim(),
      volume: num(c[3]),
      side: (c[4] ?? "").trim().toUpperCase(),
      closeTime: (c[5] ?? "").trim(),
      openPrice: num(c[6]),
      closePrice: num(c[7]),
      stopLoss: num(c[8]),
      takeProfit: num(c[9]),
      swap: num(c[10]),
      commission: num(c[11]),
      profit: num(c[12]),
      reason: (c[13] ?? "").trim().toUpperCase(),
    });
  }
  return rows.filter((r) => r.id);
}

const stripTags = (html: string): string =>
  html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .trim();

/** Extract visible (non-hidden) cell texts per table row. Uses DOMParser in the browser, regex fallback elsewhere. */
function mt5TableRows(html: string): string[][] {
  if (typeof DOMParser !== "undefined") {
    try {
      const doc = new DOMParser().parseFromString(html, "text/html");
      return [...doc.querySelectorAll("tr")].map((tr) =>
        [...tr.querySelectorAll("td, th")]
          .filter((c) => !(c as HTMLElement).classList?.contains("hidden"))
          .map((c) => (c.textContent ?? "").replace(/\u00a0/g, " ").trim()),
      );
    } catch {
      /* fall through to regex */
    }
  }
  const rows: string[][] = [];
  for (const tr of html.match(/<tr[\s>][\s\S]*?<\/tr\s*>/gi) ?? []) {
    const cells: string[] = [];
    for (const m of tr.matchAll(/<(td|th)([^>]*)>([\s\S]*?)<\/\1\s*>/gi)) {
      if (/hidden/i.test(m[2] ?? "")) continue;
      cells.push(stripTags(m[3] ?? ""));
    }
    rows.push(cells);
  }
  return rows;
}

const MT5_TIME = /^\d{4}\.\d{1,2}\.\d{1,2}\s+\d{1,2}:\d{2}/;

function mt5Reason(comment: string): string {
  if (/\[tp\b/i.test(comment)) return "TP";
  if (/\[sl\b/i.test(comment)) return "SL";
  return "";
}

/**
 * Parse a MetaTrader 5 "Trade History Report" (.html) into typed rows.
 * Source is the Positions table (one row per closed/open position, keyed by
 * Position ID); the close reason (TP/SL) is joined from the Deals "out" legs.
 */
export function parseMt5Html(html: string): ExecutionRow[] {
  const rows = mt5TableRows(html);
  let section = "";
  const positions: string[][] = [];
  const deals: string[][] = [];
  for (const cells of rows) {
    const first = (cells[0] ?? "").trim();
    const single = cells.filter((c) => c !== "").join(" ");
    if (/^positions$/i.test(single)) {
      section = "positions";
      continue;
    }
    if (/^orders$/i.test(single)) {
      section = "orders";
      continue;
    }
    if (/^deals$/i.test(single)) {
      section = "deals";
      continue;
    }
    if (/^(results|balance|total)/i.test(first) && cells.length <= 6) section = "";
    if (section === "positions") positions.push(cells);
    else if (section === "deals") deals.push(cells);
  }

  // Deals "out" legs: Symbol | Volume | Close time | Close price -> reason.
  const reasons = new Map<string, string>();
  for (const c of deals) {
    // Time | Deal | Symbol | Type | Direction | Volume | Price | Order | Cost | Commission | Fee | Swap | Profit | Balance | Comment
    if (c.length < 14 || !MT5_TIME.test(c[0] ?? "")) continue;
    if ((c[4] ?? "").trim().toLowerCase() !== "out") continue;
    const key = `${(c[2] ?? "").toUpperCase()}|${num(c[5])}|${(c[0] ?? "").trim()}|${num(c[6])}`;
    const r = mt5Reason(c[c.length - 1] ?? "");
    if (r && !reasons.has(key)) reasons.set(key, r);
  }

  const out: ExecutionRow[] = [];
  for (const c of positions) {
    // Time | Position | Symbol | Type | Volume | Price | S/L | T/P | Time | Price | Commission | Swap | Profit
    if (c.length < 13 || !MT5_TIME.test(c[0] ?? "")) continue;
    const id = (c[1] ?? "").trim();
    const symbol = (c[2] ?? "").trim();
    if (!/^\d+$/.test(id) || !symbol) continue;
    const openTime = (c[0] ?? "").trim();
    const volume = num(c[4]);
    const closeTime = (c[8] ?? "").trim();
    const closePrice = num(c[9]);
    const reason =
      reasons.get(`${symbol.toUpperCase()}|${volume}|${closeTime}|${closePrice}`) ?? "";
    out.push({
      id,
      symbol,
      openTime,
      volume,
      side: (c[3] ?? "").trim().toUpperCase(),
      closeTime,
      openPrice: num(c[5]),
      closePrice,
      stopLoss: num(c[6]),
      takeProfit: num(c[7]),
      swap: num(c[11]),
      commission: num(c[10]),
      profit: num(c[12]),
      reason,
    });
  }
  return out.filter((r) => r.id);
}

/** Parse "DD/MM/YYYY HH:MM:SS" or MT5 "YYYY.MM.DD HH:MM:SS" into a Date (local time). Null when unparseable. */
export function parseBrokerTime(s: string): Date | null {
  const slash = s.match(
    /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/,
  );
  if (slash) {
    const [, dd, mm, yyyy, hh, mi, ss] = slash;
    const d = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(mi),
      Number(ss ?? "0"),
    );
    return Number.isFinite(d.getTime()) ? d : null;
  }
  const dotted = s.match(
    /(\d{4})\.(\d{1,2})\.(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/,
  );
  if (!dotted) return null;
  const [, yyyy, mm, dd, hh, mi, ss] = dotted;
  const d = new Date(
    Number(yyyy),
    Number(mm) - 1,
    Number(dd),
    Number(hh),
    Number(mi),
    Number(ss ?? "0"),
  );
  return Number.isFinite(d.getTime()) ? d : null;
}

export function toDateInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function toTimeInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}
