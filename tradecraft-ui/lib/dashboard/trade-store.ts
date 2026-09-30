import { createRng } from "./seed";
import { getDemoTrades } from "./trades";
import { LEGACY_NEW_TRADES_KEY, NEW_TRADES_KEY } from "./trade-options";
import { makeThumb, type ShotRef, type TradeRecord } from "./trade-record";
import type { ExecutionRow } from "./execution-csv";

const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;

const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

function shotRefs(v: unknown): ShotRef[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((s) => {
    if (typeof s === "string") return [{ name: s }];
    if (s && typeof s === "object") {
      const o = s as Record<string, unknown>;
      return typeof o["name"] === "string"
        ? [
            {
              name: o["name"] as string,
              ...(typeof o["src"] === "string" ? { src: o["src"] as string } : {}),
              ...(typeof o["tvUrl"] === "string" ? { tvUrl: o["tvUrl"] as string } : {}),
            },
          ]
        : [];
    }
    return [];
  });
}

function execRows(v: unknown): ExecutionRow[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((r) => {
    if (!r || typeof r !== "object") return [];
    const o = r as Record<string, unknown>;
    if (typeof o["id"] !== "string" || !o["id"]) return [];
    return [
      {
        id: o["id"] as string,
        symbol: str(o["symbol"]),
        openTime: str(o["openTime"]),
        volume: num(o["volume"]),
        side: str(o["side"], "—"),
        closeTime: str(o["closeTime"]),
        openPrice: num(o["openPrice"]),
        closePrice: num(o["closePrice"]),
        stopLoss: num(o["stopLoss"]),
        takeProfit: num(o["takeProfit"]),
        swap: num(o["swap"]),
        commission: num(o["commission"]),
        profit: num(o["profit"]),
        reason: str(o["reason"]),
      },
    ];
  });
}

/** Normalize one raw localStorage draft into a TradeRecord. Null when unusable. */
export function normalizeUserTrade(raw: unknown, index: number): TradeRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const pair = str(o["pair"]);
  if (!pair) return null;
  const side = o["side"] === "short" ? "short" : o["side"] === "long" ? "long" : null;
  if (!side) return null;
  const outcomeRaw = str(o["outcome"]);
  const outcome: TradeRecord["outcome"] =
    outcomeRaw === "TP" || outcomeRaw === "SL" || outcomeRaw === "BE" ? outcomeRaw : "BE";
  const rr = str(o["rr"]);
  const rrNum = rr === "custom" ? num(o["rrCustom"]) : num(rr);
  const rCap = outcome === "TP" ? rrNum || 0 : outcome === "SL" ? -1 : 0;
  const id = typeof o["id"] === "string" && o["id"] ? (o["id"] as string) : `u-${index}`;
  const hash = [...id].reduce((x, c) => (x * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rec: TradeRecord = {
    id,
    source: "user",
    pair,
    side,
    outcome,
    session: str(o["session"]),
    prevDay: str(o["prevDay"]),
    h4Trend: str(o["h4Trend"]),
    phase: str(o["phase"]),
    model: str(o["model"]),
    mechanicsContext: str(o["mechanicsContext"]),
    entries: strArr(o["entries"]),
    execType: str(o["execType"]),
    alignment: str(o["alignment"]),
    pois: strArr(o["pois"]),
    rr,
    rrCustom: str(o["rrCustom"]),
    riskPct: str(o["riskPct"]),
    riskCustom: str(o["riskCustom"]),
    tradeDate: str(o["tradeDate"]),
    inducementTime: str(o["inducementTime"]),
    entryTime: str(o["entryTime"]),
    exitTime: str(o["exitTime"]),
    openPrice: num(o["openPrice"]),
    slPrice: num(o["slPrice"]),
    closePrice: num(o["closePrice"]),
    tpPrice: num(o["tpPrice"]),
    lots: num(o["lots"]),
    pips: num(o["pips"]),
    pipsPoints: o["pipsPoints"] === true,
    gross: num(o["gross"]),
    swap: num(o["swap"]),
    commission: num(o["commission"]),
    net: num(o["net"]),
    validity: o["validity"] === "invalid" ? "invalid" : o["validity"] === "valid" ? "valid" : "",
    psychTags: strArr(o["psychTags"]),
    psychNote: str(o["psychNote"]),
    notes: str(o["notes"]),
    orderIds: strArr(o["orderIds"]),
    executions: execRows(o["executions"]),
    entryShots: shotRefs(o["entryShots"]),
    tradeShots: shotRefs(o["tradeShots"]),
    thumb: "",
    createdAt: str(o["savedAt"]) || str(o["createdAt"]) || new Date().toISOString(),
  };
  if (typeof o["thumb"] === "string" && o["thumb"]) {
    rec.thumb = o["thumb"] as string;
  } else {
    rec.thumb = makeThumb(
      { long: side === "long", plan: Math.max(1, Math.round(Math.abs(rCap)) || 1), r: rCap },
      createRng(hash),
    );
  }
  if (!rec.executions.length && rec.orderIds.length) {
    rec.executions = [
      {
        id: rec.orderIds[0],
        symbol: rec.pair,
        openTime: rec.entryTime,
        volume: rec.lots,
        side: side === "long" ? "BUY" : "SELL",
        closeTime: rec.exitTime,
        openPrice: rec.openPrice,
        closePrice: rec.closePrice,
        stopLoss: rec.slPrice,
        takeProfit: rec.tpPrice,
        swap: rec.swap,
        commission: rec.commission,
        profit: rec.gross,
        reason: rec.outcome,
      },
    ];
  }
  return rec;
}

function readUserTrades(): TradeRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw =
      window.localStorage.getItem(NEW_TRADES_KEY) ??
      window.localStorage.getItem(LEGACY_NEW_TRADES_KEY);
    if (!raw) return [];
    // One-time migration off the pre-rename key.
    if (!window.localStorage.getItem(NEW_TRADES_KEY)) {
      try {
        window.localStorage.setItem(NEW_TRADES_KEY, raw);
        window.localStorage.removeItem(LEGACY_NEW_TRADES_KEY);
      } catch {
        /* storage unavailable */
      }
    }
    const all = JSON.parse(raw) as unknown;
    if (!Array.isArray(all)) return [];
    return all.flatMap((r, i) => {
      const t = normalizeUserTrade(r, i);
      return t ? [t] : [];
    });
  } catch {
    return [];
  }
}

/** Demo trades plus user trades from localStorage (newest first for users). */
export function getAllTradeRecords(): TradeRecord[] {
  return [...readUserTrades().reverse(), ...getDemoTrades()];
}

/** Local user drafts only, newest first (used to merge unsynced drafts). */
export function getLocalUserTrades(): TradeRecord[] {
  return readUserTrades().reverse();
}

export function getTradeRecord(id: string): TradeRecord | undefined {
  return getAllTradeRecords().find((t) => t.id === id);
}

export function getDemoTrade(id: string): TradeRecord | undefined {
  return getDemoTrades().find((t) => t.id === id);
}

/** Prev/next ids within the merged list order. */
export function getNeighborIds(id: string): { prev?: string; next?: string } {
  const all = getAllTradeRecords();
  const ix = all.findIndex((t) => t.id === id);
  if (ix < 0) return {};
  return {
    ...(ix > 0 ? { prev: all[ix - 1].id } : {}),
    ...(ix < all.length - 1 ? { next: all[ix + 1].id } : {}),
  };
}
