import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readJsonBody } from "../lib/auth-helpers.js";
import { authorizedUser } from "../lib/auth.js";
import { applyCors, sendError } from "../lib/cors.js";
import { getServiceClient } from "../lib/supabase.js";
import { loadRecords } from "../lib/trade-loader.js";
import {
  draftToRow,
  executionToRow,
  shotToRow,
  validateDraft,
  type TradeRow,
  type WireExecution,
  type WireShot,
} from "../lib/trades-map.js";
import { asLimit, asOffset } from "../lib/validate.js";

function escapeIlike(v: string): string {
  return v.replace(/[%(),\\]/g, (c) => `\\${c}`);
}

type SortKey = "date" | "pair" | "model" | "r" | "net";

function asSort(v: unknown): SortKey {
  return v === "pair" || v === "model" || v === "r" || v === "net"
    ? v
    : "date";
}

function asDir(v: unknown): "asc" | "desc" {
  return v === "asc" ? "asc" : "desc";
}

async function handleList(req: VercelRequest, res: VercelResponse): Promise<void> {
  const userId = await authorizedUser(req, res);
  if (!userId) return;
  const supabase = getServiceClient();
  const q = req.query ?? {};

  const status = typeof q["status"] === "string" ? q["status"] : "";
  const model = typeof q["model"] === "string" ? q["model"].trim() : "";
  const pair = typeof q["pair"] === "string" ? q["pair"].trim().toUpperCase() : "";
  const session = typeof q["session"] === "string" ? q["session"].trim() : "";
  const search = typeof q["q"] === "string" ? q["q"].trim() : "";
  const sort = asSort(q["sort"]);
  const dir = asDir(q["dir"]);
  const ascending = dir === "asc";
  const limit = asLimit(q["limit"]);
  const offset = asOffset(q["offset"]);

  let query = supabase
    .from("trades")
    .select("*", { count: "exact" })
    .eq("user_id", userId);
  if (status === "TP" || status === "SL" || status === "BE") {
    query = query.eq("outcome", status);
  }
  if (model) query = query.eq("model", model);
  if (pair) query = query.eq("pair", pair);
  if (session) query = query.eq("session", session);
  if (search) {
    const e = escapeIlike(search);
    query = query.or(`pair.ilike.%${e}%,model.ilike.%${e}%`);
  }

  if (sort === "date") {
    query = query
      .order("trade_date", { ascending, nullsFirst: false })
      .order("created_at", { ascending });
  } else if (sort === "pair" || sort === "model" || sort === "net") {
    const col = sort === "net" ? "net" : sort;
    query = query.order(col, { ascending });
  }

  if (sort === "r") {
    // R is derived (rr preset/custom × outcome) — sort in memory.
    const { data, error } = await query.limit(2000);
    if (error) {
      sendError(res, 500, "server_error", "Could not list trades.");
      return;
    }
    const rows = (data ?? []) as TradeRow[];
    const { capturedR } = await import("../lib/trades-map.js");
    rows.sort((a, b) => {
      const ra = capturedR({
        rr: typeof a["rr"] === "string" ? a["rr"] : "",
        rrCustom: typeof a["rr_custom"] === "string" ? a["rr_custom"] : "",
        outcome: typeof a["outcome"] === "string" ? a["outcome"] : "",
      });
      const rb = capturedR({
        rr: typeof b["rr"] === "string" ? b["rr"] : "",
        rrCustom: typeof b["rr_custom"] === "string" ? b["rr_custom"] : "",
        outcome: typeof b["outcome"] === "string" ? b["outcome"] : "",
      });
      return ascending ? ra - rb : rb - ra;
    });
    const page = rows.slice(offset, offset + limit);
    const records = await loadRecords(supabase, page);
    res
      .status(200)
      .json({ data: records, total: rows.length, limit, offset });
    return;
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);
  if (error) {
    sendError(res, 500, "server_error", "Could not list trades.");
    return;
  }
  const records = await loadRecords(supabase, (data ?? []) as TradeRow[]);
  res
    .status(200)
    .json({ data: records, total: count ?? records.length, limit, offset });
}

function createdAtOverride(body: Record<string, unknown>): string | null {
  const raw = body["createdAt"] ?? body["savedAt"];
  if (typeof raw !== "string" || !raw) return null;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

async function handleCreate(
  req: VercelRequest,
  res: VercelResponse,
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
  const row = draftToRow(userId, body);
  const createdAt = createdAtOverride(body);
  if (createdAt) row["created_at"] = createdAt;

  const { data: inserted, error: insertError } = await supabase
    .from("trades")
    .insert(row)
    .select()
    .single();
  if (insertError || !inserted) {
    if (insertError?.code === "23505") {
      sendError(res, 409, "conflict", "This trade already exists.");
      return;
    }
    sendError(res, 500, "server_error", "Could not create the trade.");
    return;
  }
  const tradeId = String((inserted as TradeRow)["id"]);

  const executions = Array.isArray(body["executions"])
    ? (body["executions"] as WireExecution[])
    : [];
  if (executions.length > 0) {
    const { error: execError } = await supabase
      .from("trade_executions")
      .insert(executions.map((r) => executionToRow(tradeId, r)));
    if (execError) {
      // Roll back the parent so a half-created trade never persists.
      await supabase.from("trades").delete().eq("id", tradeId);
      if (execError.code === "23505") {
        sendError(res, 409, "conflict", "Duplicate broker order for this trade.");
        return;
      }
      sendError(res, 500, "server_error", "Could not save executions.");
      return;
    }
  }

  const shots: { kind: "entry" | "trade"; shot: WireShot }[] = [
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
  if (shots.length > 0) {
    const { error: shotError } = await supabase
      .from("trade_shots")
      .insert(shots.map((s) => shotToRow(tradeId, s.kind, s.shot)));
    if (shotError) {
      await supabase.from("trades").delete().eq("id", tradeId);
      sendError(res, 500, "server_error", "Could not save screenshots.");
      return;
    }
  }

  const records = await loadRecords(supabase, [inserted as TradeRow]);
  res.status(201).json(records[0] ?? inserted);
}

/**
 * /api/trades — GET (list) / POST (create)
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (applyCors(req, res)) return;
  if (req.method === "GET") {
    await handleList(req, res);
    return;
  }
  if (req.method === "POST") {
    await handleCreate(req, res);
    return;
  }
  res.setHeader("Allow", "GET, POST");
  sendError(res, 405, "method_not_allowed", "Only GET and POST are allowed");
}
