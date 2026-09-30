import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readJsonBody } from "../../../../lib/auth-helpers.js";
import { authorizedUser } from "../../../../lib/auth.js";
import { applyCors, sendError } from "../../../../lib/cors.js";
import { loadDayRow } from "../../../../lib/journal.js";
import { getServiceClient } from "../../../../lib/supabase.js";
import { asString, asTrimmed, isDateString, isUuid } from "../../../../lib/validate.js";

function param(req: VercelRequest, key: string): string {
  const raw = req.query[key];
  return Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
}

/**
 * PATCH /api/journal/[date]/files/[fileId] — rename/edit ({ name?, body? }).
 * DELETE — remove the file → 204.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (applyCors(req, res)) return;
  const date = param(req, "date");
  const fileId = param(req, "fileId");
  if (!isDateString(date)) {
    sendError(res, 400, "bad_request", "date must be YYYY-MM-DD.");
    return;
  }
  if (!isUuid(fileId)) {
    sendError(res, 400, "bad_request", "Invalid file id.");
    return;
  }
  const userId = await authorizedUser(req, res);
  if (!userId) return;
  const supabase = getServiceClient();

  // Ownership: the file must belong to a day owned by the caller.
  const day = await loadDayRow(supabase, userId, date);
  if (!day) {
    sendError(res, 404, "not_found", "Journal file not found.");
    return;
  }
  const { data: file, error: fileError } = await supabase
    .from("journal_files")
    .select("id, name, body")
    .eq("id", fileId)
    .eq("day_id", day.id)
    .maybeSingle();
  if (fileError || !file) {
    sendError(res, 404, "not_found", "Journal file not found.");
    return;
  }

  if (req.method === "PATCH") {
    const body = readJsonBody(req);
    const patch: { name?: string; body?: string; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };
    if (body["name"] !== undefined) {
      const name = asTrimmed(body["name"]).slice(0, 120);
      if (!name) {
        sendError(res, 400, "bad_request", "File name cannot be empty.");
        return;
      }
      patch.name = name;
    }
    if (body["body"] !== undefined) {
      if (typeof body["body"] !== "string") {
        sendError(res, 400, "bad_request", "body must be a string.");
        return;
      }
      patch.body = asString(body["body"]);
    }
    const { data: updated, error: updateError } = await supabase
      .from("journal_files")
      .update(patch)
      .eq("id", fileId)
      .select("id, name, body")
      .single();
    if (updateError || !updated) {
      sendError(res, 500, "server_error", "Could not update the file.");
      return;
    }
    const row = updated as { id: string; name: string; body: string };
    res.status(200).json({ id: row.id, name: row.name, body: row.body ?? "" });
    return;
  }

  if (req.method === "DELETE") {
    const { error: deleteError } = await supabase
      .from("journal_files")
      .delete()
      .eq("id", fileId);
    if (deleteError) {
      sendError(res, 500, "server_error", "Could not delete the file.");
      return;
    }
    res.status(204).end();
    return;
  }

  res.setHeader("Allow", "PATCH, DELETE");
  sendError(res, 405, "method_not_allowed", "Only PATCH and DELETE are allowed");
}
