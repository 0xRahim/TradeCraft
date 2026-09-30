import {
  asBoolean,
  asNullableNumber,
  asOutcome,
  asSide,
  asString,
  asStringArray,
  asTrimmed,
  asValidity,
} from "./validate.js";

/**
 * Mapping between the wire `TradeRecord` shape (camelCase, mirroring
 * tradecraft-ui `TradeRecord` minus `thumb`) and the `trades` table
 * (snake_case). See API.md field-mapping table.
 */

export type WireExecution = {
  id?: string;
  brokerOrderId?: string;
  symbol?: string;
  side?: string;
  openTime?: string;
  closeTime?: string;
  volume?: number;
  openPrice?: number;
  closePrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  swap?: number;
  commission?: number;
  profit?: number;
  reason?: string;
};

export type WireShot = {
  id?: string;
  name?: string;
  storagePath?: string | null;
  srcUrl?: string | null;
  tvUrl?: string | null;
};

/** Full trade record over the wire (`thumb` omitted — the UI regenerates it). */
export type ApiTradeRecord = {
  id: string;
  source: "user";
  pair: string;
  side: "long" | "short";
  outcome: "TP" | "SL" | "BE";
  session: string;
  prevDay: string;
  h4Trend: string;
  phase: string;
  model: string;
  mechanicsContext: string;
  entries: string[];
  execType: string;
  alignment: string;
  pois: string[];
  rr: string;
  rrCustom: string;
  riskPct: string;
  riskCustom: string;
  tradeDate: string | null;
  inducementTime: string;
  entryTime: string;
  exitTime: string;
  openPrice: number;
  slPrice: number;
  closePrice: number;
  tpPrice: number;
  lots: number;
  pips: number;
  pipsPoints: boolean;
  gross: number;
  swap: number;
  commission: number;
  net: number;
  validity: "valid" | "invalid" | "";
  psychTags: string[];
  psychNote: string;
  notes: string;
  orderIds: string[];
  executions: WireExecution[];
  entryShots: WireShot[];
  tradeShots: WireShot[];
  createdAt: string;
};

export type TradeRow = Record<string, unknown>;
export type ExecutionRowDb = Record<string, unknown>;
export type ShotRowDb = Record<string, unknown>;

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function strArr(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : [];
}

/** Validate the draft body for POST/PATCH. Returns an error message or null. */
export function validateDraft(
  body: Record<string, unknown>,
): string | null {
  if (!asTrimmed(body["pair"])) return "Pair is required.";
  if (!asSide(body["side"])) return "Side must be long or short.";
  if (!asOutcome(body["outcome"])) return "Outcome must be TP, SL or BE.";
  const tradeDate = body["tradeDate"];
  if (
    tradeDate !== undefined &&
    tradeDate !== null &&
    tradeDate !== "" &&
    (typeof tradeDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(tradeDate))
  ) {
    return "tradeDate must be YYYY-MM-DD.";
  }
  const executions = body["executions"];
  if (executions !== undefined && !Array.isArray(executions)) {
    return "executions must be an array.";
  }
  for (const r of Array.isArray(executions) ? executions : []) {
    if (!r || typeof r !== "object") return "Invalid execution row.";
    const o = r as Record<string, unknown>;
    const brokerId = asTrimmed(o["brokerOrderId"]) || asTrimmed(o["id"]);
    if (!brokerId) return "Each execution needs a broker order id.";
  }
  for (const key of ["entryShots", "tradeShots"] as const) {
    const shots = body[key];
    if (shots !== undefined && !Array.isArray(shots)) {
      return `${key} must be an array.`;
    }
    for (const s of Array.isArray(shots) ? shots : []) {
      if (!s || typeof s !== "object") return `Invalid shot in ${key}.`;
      if (!asTrimmed((s as Record<string, unknown>)["name"])) {
        return `Each shot in ${key} needs a name.`;
      }
    }
  }
  return null;
}

/** Convert a draft body into a `trades` insert/update row (snake_case). */
export function draftToRow(
  userId: string,
  body: Record<string, unknown>,
): Record<string, unknown> {
  const tradeDate = asTrimmed(body["tradeDate"]);
  return {
    user_id: userId,
    pair: asTrimmed(body["pair"]),
    side: asSide(body["side"]) ?? "long",
    outcome: asOutcome(body["outcome"]) ?? "BE",
    session: asTrimmed(body["session"]),
    prev_day: asTrimmed(body["prevDay"]),
    h4_trend: asTrimmed(body["h4Trend"]),
    phase: asTrimmed(body["phase"]),
    model: asTrimmed(body["model"]),
    mechanics_context: asTrimmed(body["mechanicsContext"]),
    entries: asStringArray(body["entries"]),
    exec_type: asTrimmed(body["execType"]),
    alignment: asTrimmed(body["alignment"]),
    pois: asStringArray(body["pois"]),
    rr: asTrimmed(body["rr"]),
    rr_custom: asTrimmed(body["rrCustom"]),
    risk_pct: asTrimmed(body["riskPct"]),
    risk_custom: asTrimmed(body["riskCustom"]),
    trade_date: tradeDate ? tradeDate : null,
    inducement_time: asTrimmed(body["inducementTime"]),
    entry_time: asTrimmed(body["entryTime"]),
    exit_time: asTrimmed(body["exitTime"]),
    open_price: asNullableNumber(body["openPrice"]) ?? 0,
    sl_price: asNullableNumber(body["slPrice"]) ?? 0,
    close_price: asNullableNumber(body["closePrice"]) ?? 0,
    tp_price: asNullableNumber(body["tpPrice"]) ?? 0,
    lots: asNullableNumber(body["lots"]) ?? 0,
    pips: asNullableNumber(body["pips"]) ?? 0,
    pips_points: asBoolean(body["pipsPoints"]),
    gross: asNullableNumber(body["gross"]) ?? 0,
    swap: asNullableNumber(body["swap"]) ?? 0,
    commission: asNullableNumber(body["commission"]) ?? 0,
    net: asNullableNumber(body["net"]) ?? 0,
    validity: asValidity(body["validity"]),
    psych_tags: asStringArray(body["psychTags"]),
    psych_note: asTrimmed(body["psychNote"]),
    notes: asString(body["notes"]),
    order_ids: asStringArray(body["orderIds"]),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Broker order id for an execution input. Round-tripped rows carry both
 * `id` (server uuid) and `brokerOrderId`; fresh CSV rows only have `id`.
 */
export function executionBrokerId(r: WireExecution): string {
  return asTrimmed(r.brokerOrderId) || asTrimmed(r.id);
}

export function executionToRow(
  tradeId: string,
  r: WireExecution,
): Record<string, unknown> {
  return {
    trade_id: tradeId,
    broker_order_id: executionBrokerId(r),
    symbol: asTrimmed(r.symbol),
    side: asTrimmed(r.side),
    open_time: asTrimmed(r.openTime),
    close_time: asTrimmed(r.closeTime),
    volume: num(r.volume),
    open_price: num(r.openPrice),
    close_price: num(r.closePrice),
    stop_loss: num(r.stopLoss),
    take_profit: num(r.takeProfit),
    swap: num(r.swap),
    commission: num(r.commission),
    profit: num(r.profit),
    reason: asTrimmed(r.reason),
  };
}

export function shotToRow(
  tradeId: string,
  kind: "entry" | "trade",
  s: WireShot,
): Record<string, unknown> {
  const storagePath = s.storagePath == null ? null : asTrimmed(s.storagePath) || null;
  const srcUrl = s.srcUrl == null ? null : asTrimmed(s.srcUrl) || null;
  const tvUrl = s.tvUrl == null ? null : asTrimmed(s.tvUrl) || null;
  return {
    trade_id: tradeId,
    kind,
    name: asTrimmed(s.name),
    storage_path: storagePath,
    src_url: srcUrl,
    tv_url: tvUrl,
  };
}

function executionToWire(r: ExecutionRowDb): WireExecution {
  return {
    id: str(r["id"]),
    brokerOrderId: str(r["broker_order_id"]),
    symbol: str(r["symbol"]),
    side: str(r["side"]),
    openTime: str(r["open_time"]),
    closeTime: str(r["close_time"]),
    volume: num(r["volume"]),
    openPrice: num(r["open_price"]),
    closePrice: num(r["close_price"]),
    stopLoss: num(r["stop_loss"]),
    takeProfit: num(r["take_profit"]),
    swap: num(r["swap"]),
    commission: num(r["commission"]),
    profit: num(r["profit"]),
    reason: str(r["reason"]),
  };
}

function shotToWire(r: ShotRowDb): WireShot {
  return {
    id: str(r["id"]),
    name: str(r["name"]),
    storagePath: r["storage_path"] == null ? null : str(r["storage_path"]),
    srcUrl: r["src_url"] == null ? null : str(r["src_url"]),
    tvUrl: r["tv_url"] == null ? null : str(r["tv_url"]),
  };
}

/** Assemble a full wire record from a trade row + its children. */
export function rowToRecord(
  row: TradeRow,
  executions: ExecutionRowDb[],
  shots: ShotRowDb[],
): ApiTradeRecord {
  return {
    id: str(row["id"]),
    source: "user",
    pair: str(row["pair"]),
    side: (row["side"] === "short" ? "short" : "long") as "long" | "short",
    outcome: (["TP", "SL", "BE"] as string[]).includes(str(row["outcome"]))
      ? (row["outcome"] as "TP" | "SL" | "BE")
      : "BE",
    session: str(row["session"]),
    prevDay: str(row["prev_day"]),
    h4Trend: str(row["h4_trend"]),
    phase: str(row["phase"]),
    model: str(row["model"]),
    mechanicsContext: str(row["mechanics_context"]),
    entries: strArr(row["entries"]),
    execType: str(row["exec_type"]),
    alignment: str(row["alignment"]),
    pois: strArr(row["pois"]),
    rr: str(row["rr"]),
    rrCustom: str(row["rr_custom"]),
    riskPct: str(row["risk_pct"]),
    riskCustom: str(row["risk_custom"]),
    tradeDate:
      row["trade_date"] == null || row["trade_date"] === ""
        ? null
        : str(row["trade_date"]),
    inducementTime: str(row["inducement_time"]),
    entryTime: str(row["entry_time"]),
    exitTime: str(row["exit_time"]),
    openPrice: num(row["open_price"]),
    slPrice: num(row["sl_price"]),
    closePrice: num(row["close_price"]),
    tpPrice: num(row["tp_price"]),
    lots: num(row["lots"]),
    pips: num(row["pips"]),
    pipsPoints: row["pips_points"] === true,
    gross: num(row["gross"]),
    swap: num(row["swap"]),
    commission: num(row["commission"]),
    net: num(row["net"]),
    validity: asValidity(row["validity"]),
    psychTags: strArr(row["psych_tags"]),
    psychNote: str(row["psych_note"]),
    notes: str(row["notes"]),
    orderIds: strArr(row["order_ids"]),
    executions: executions.map(executionToWire),
    entryShots: shots
      .filter((s) => s["kind"] === "entry")
      .map(shotToWire),
    tradeShots: shots
      .filter((s) => s["kind"] === "trade")
      .map(shotToWire),
    createdAt: str(row["created_at"]),
  };
}

/** Captured R multiple (mirrors the frontend `recordR`). */
export function capturedR(rec: {
  rr: string;
  rrCustom: string;
  outcome: string;
}): number {
  if (rec.rr === "custom") return Number(rec.rrCustom) || 0;
  const preset = Number(rec.rr);
  if (Number.isFinite(preset) && preset > 0) {
    return rec.outcome === "SL" ? -1 : rec.outcome === "BE" ? 0 : preset;
  }
  return 0;
}
