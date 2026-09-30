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
  const n = Number(String(v ?? "").trim());
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

/** Parse "DD/MM/YYYY HH:MM:SS" into a Date (local time). Null when unparseable. */
export function parseBrokerTime(s: string): Date | null {
  const m = s.match(
    /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/,
  );
  if (!m) return null;
  const [, dd, mm, yyyy, hh, mi, ss] = m;
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
