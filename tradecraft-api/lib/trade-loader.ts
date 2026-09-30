import type { SupabaseClient } from "@supabase/supabase-js";
import {
  rowToRecord,
  type ApiTradeRecord,
  type ExecutionRowDb,
  type ShotRowDb,
  type TradeRow,
} from "./trades-map.js";

/**
 * Load full wire records for trade rows: children are fetched batched
 * via `.in()` (no N+1) and attached in `rowToRecord` order.
 */
export async function loadRecords(
  supabase: SupabaseClient,
  rows: TradeRow[],
): Promise<ApiTradeRecord[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => String(r["id"]));
  const [{ data: executions }, { data: shots }] = await Promise.all([
    supabase.from("trade_executions").select("*").in("trade_id", ids),
    supabase.from("trade_shots").select("*").in("trade_id", ids),
  ]);
  const execByTrade = new Map<string, ExecutionRowDb[]>();
  for (const e of (executions ?? []) as ExecutionRowDb[]) {
    const key = String(e["trade_id"]);
    const list = execByTrade.get(key) ?? [];
    list.push(e);
    execByTrade.set(key, list);
  }
  const shotsByTrade = new Map<string, ShotRowDb[]>();
  for (const s of (shots ?? []) as ShotRowDb[]) {
    const key = String(s["trade_id"]);
    const list = shotsByTrade.get(key) ?? [];
    list.push(s);
    shotsByTrade.set(key, list);
  }
  return rows.map((row) =>
    rowToRecord(
      row,
      execByTrade.get(String(row["id"])) ?? [],
      shotsByTrade.get(String(row["id"])) ?? [],
    ),
  );
}

/** Fetch one trade row scoped to the caller. Null when missing/foreign. */
export async function loadTradeRow(
  supabase: SupabaseClient,
  userId: string,
  tradeId: string,
): Promise<TradeRow | null> {
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .eq("id", tradeId)
    .maybeSingle();
  if (error || !data) return null;
  return data as TradeRow;
}
