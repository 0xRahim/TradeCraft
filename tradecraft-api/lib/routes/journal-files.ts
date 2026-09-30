import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readJsonBody } from "../auth-helpers.js";
import { authorizedUser } from "../auth.js";
import { applyCors, sendError } from "../cors.js";
import { ensureDay } from "../journal.js";
import { getServiceClient } from "../supabase.js";
import { asString, asTrimmed, isDateString } from "../validate.js";

function dateFrom(req: VercelRequest): string {
  const raw = req.query["date"];
  return Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
}

/**
 * POST /api/journal/[date]/files — { name, body } → 201 file JSON.
 * Auto-creates the day row (grade null, status "pending").
 */
export async function handleJournalFiles(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (applyCors(req, res)) return;
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendError(res, 405, "method_not_allowed", "Only POST is allowed");
    return;
  }
  const date = dateFrom(req);
  if (!isDateString(date)) {
    sendError(res, 400, "bad_request", "date must be YYYY-MM-DD.");
    return;
  }
  const userId = await authorizedUser(req, res);
  if (!userId) return;

  const body = readJsonBody(req);
  const name = asTrimmed(body["name"]).slice(0, 120);
  if (!name) {
    sendError(res, 400, "bad_request", "File name is required.");
    return;
  }
  const fileBody = asString(body["body"]);

  const supabase = getServiceClient();
  const dayId = await ensureDay(supabase, userId, date);
  if (!dayId) {
    sendError(res, 500, "server_error", "Could not save the journal file.");
    return;
  }
  const { data, error } = await supabase
    .from("journal_files")
    .insert({ day_id: dayId, name, body: fileBody })
    .select("id, name, body")
    .single();
  if (error || !data) {
    sendError(res, 500, "server_error", "Could not save the journal file.");
    return;
  }
  const file = data as { id: string; name: string; body: string };
  res.status(201).json({ id: file.id, name: file.name, body: file.body ?? "" });
}
