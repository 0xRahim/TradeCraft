import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readJsonBody } from "../auth-helpers.js";
import { authorizedUser } from "../auth.js";
import { applyCors, sendError } from "../cors.js";
import { getServiceClient } from "../supabase.js";
import { removeTradeObjects } from "../storage-helpers.js";
import { loadRecords, loadTradeRow } from "../trade-loader.js";
import {
  draftToRow,
  executionBrokerId,
  executionToRow,
  shotToRow,
  validateDraft,
  type ExecutionRowDb,
  type ShotRowDb,
  type TradeRow,
  type WireExecution,
  type WireShot,
} from "../trades-map.js";
import { isUuid } from "../validate.js";

function tradeIdFrom(req: VercelRequest): string {
  const raw = req.query["id"];
  return Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
}

async function handleGet(
  req: VercelRequest,
  res: VercelResponse,
  tradeId: string,
): Promise<void> {
  const userId = await authorizedUser(req, res);
  if (!userId) return;
  const supabase = getServiceClient();
  const row = await loadTradeRow(supabase, userId, tradeId);
  if (!row) {
    sendError(res, 404, "not_found", "Trade not found.");
    return;
  }
  const records = await loadRecords(supabase, [row]);
  res.status(200).json(records[0]);
}

async function handlePatch(
  req: VercelRequest,
  res: VercelResponse,
  tradeId: string,
): Promise<void> {
  const userId = await authorizedUser(req, res);
  if (!userId) return;
  const body = readJsonBody(req);
  const message = validateDraft(body);
  if (message) {
    sendError(res, 400, "bad_request", message);
    return;
  }
  const supabase = getServiceClient();
  const existing = await loadTradeRow(supabase, userId, tradeId);
  if (!existing) {
    sendError(res, 404, "not_found", "Trade not found.");
    return;
  }

  // 1. Parent row (full-draft replace).
  const row = draftToRow(userId, body);
  const { error: updateError } = await supabase
    .from("trades")
    .update(row)
    .eq("id", tradeId)
    .eq("user_id", userId);
  if (updateError) {
    sendError(res, 500, "server_error", "Could not update the trade.");
    return;
  }

  // 2. Executions: upsert by (trade_id, broker_order_id), delete absent.
  const payloadExecs = Array.isArray(body["executions"])
    ? (body["executions"] as WireExecution[])
    : [];
  const { data: currentExecs } = await supabase
    .from("trade_executions")
    .select("broker_order_id")
    .eq("trade_id", tradeId);
  const currentIds = new Set(
    ((currentExecs ?? []) as { broker_order_id: string }[]).map(
      (e) => e.broker_order_id,
    ),
  );
  const payloadIds = new Set(payloadExecs.map(executionBrokerId));
  if (payloadExecs.length > 0) {
    const { error: upsertError } = await supabase
      .from("trade_executions")
      .upsert(
        payloadExecs.map((r) => executionToRow(tradeId, r)),
        { onConflict: "trade_id,broker_order_id" },
      );
    if (upsertError) {
      if (upsertError.code === "23505") {
        sendError(res, 409, "conflict", "Duplicate broker order for this trade.");
        return;
      }
      sendError(res, 500, "server_error", "Could not save executions.");
      return;
    }
  }
  const removedExecs = [...currentIds].filter((id) => !payloadIds.has(id));
  if (removedExecs.length > 0) {
    await supabase
      .from("trade_executions")
      .delete()
      .eq("trade_id", tradeId)
      .in("broker_order_id", removedExecs);
  }

  // 3. Shots: upsert by id, insert new, delete removed (+ storage cleanup).
  const payloadShots: { kind: "entry" | "trade"; shot: WireShot }[] = [
    ...(Array.isArray(body["entryShots"])
      ? (body["entryShots"] as WireShot[]).map((shot) => ({
          kind: "entry" as const,
          shot,
        }))
      : []),
    ...(Array.isArray(body["tradeShots"])
      ? (body["tradeShots"] as WireShot[]).map((shot) => ({
          kind: "trade" as const,
          shot,
        }))
      : []),
  ];
  const { data: currentShots } = await supabase
    .from("trade_shots")
    .select("*")
    .eq("trade_id", tradeId);
  const currentById = new Map<string, ShotRowDb>();
  for (const s of (currentShots ?? []) as ShotRowDb[]) {
    currentById.set(String(s["id"]), s);
  }
  const seenIds = new Set<string>();
  const toInsert: Record<string, unknown>[] = [];
  for (const { kind, shot } of payloadShots) {
    const id = typeof shot.id === "string" ? shot.id : "";
    if (id && currentById.has(id)) {
      seenIds.add(id);
      await supabase
        .from("trade_shots")
        .update(shotToRow(tradeId, kind, shot))
        .eq("id", id);
    } else {
      toInsert.push(shotToRow(tradeId, kind, shot));
    }
  }
  if (toInsert.length > 0) {
    const { error: shotError } = await supabase
      .from("trade_shots")
      .insert(toInsert);
    if (shotError) {
      sendError(res, 500, "server_error", "Could not save screenshots.");
      return;
    }
  }
  const removedShots = [...currentById.values()].filter(
    (s) => !seenIds.has(String(s["id"])),
  );
  if (removedShots.length > 0) {
    await supabase
      .from("trade_shots")
      .delete()
      .eq("trade_id", tradeId)
      .in(
        "id",
        removedShots.map((s) => String(s["id"])),
      );
    await removeTradeObjects(
      supabase,
      userId,
      tradeId,
      removedShots.map((s) =>
        s["storage_path"] == null ? null : String(s["storage_path"]),
      ),
    );
  }

  const updated = await loadTradeRow(supabase, userId, tradeId);
  if (!updated) {
    sendError(res, 404, "not_found", "Trade not found.");
    return;
  }
  const records = await loadRecords(supabase, [updated]);
  res.status(200).json(records[0]);
}

async function handleDelete(
  req: VercelRequest,
  res: VercelResponse,
  tradeId: string,
): Promise<void> {
  const userId = await authorizedUser(req, res);
  if (!userId) return;
  const supabase = getServiceClient();
  const existing = await loadTradeRow(supabase, userId, tradeId);
  if (!existing) {
    sendError(res, 404, "not_found", "Trade not found.");
    return;
  }
  const { data: shots } = await supabase
    .from("trade_shots")
    .select("storage_path")
    .eq("trade_id", tradeId);
  await removeTradeObjects(
    supabase,
    userId,
    tradeId,
    ((shots ?? []) as { storage_path: string | null }[]).map(
      (s) => s.storage_path,
    ),
  );
  // Executions + shots cascade; the row delete is scoped to the caller.
  const { error } = await supabase
    .from("trades")
    .delete()
    .eq("id", tradeId)
    .eq("user_id", userId);
  if (error) {
    sendError(res, 500, "server_error", "Could not delete the trade.");
    return;
  }
  res.status(204).end();
}

/**
 * /api/trades/[id] — GET / PATCH / DELETE
 */
export async function handleTradeById(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (applyCors(req, res)) return;
  const tradeId = tradeIdFrom(req);
  if (!tradeId || !isUuid(tradeId)) {
    sendError(res, 400, "bad_request", "Invalid trade id.");
    return;
  }
  if (req.method === "GET") {
    await handleGet(req, res, tradeId);
    return;
  }
  if (req.method === "PATCH") {
    await handlePatch(req, res, tradeId);
    return;
  }
  if (req.method === "DELETE") {
    await handleDelete(req, res, tradeId);
    return;
  }
  res.setHeader("Allow", "GET, PATCH, DELETE");
  sendError(res, 405, "method_not_allowed", "Only GET, PATCH and DELETE are allowed");
}
