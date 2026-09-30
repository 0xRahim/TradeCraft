import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readJsonBody } from "../../lib/auth-helpers.js";
import { authorizedUser } from "../../lib/auth.js";
import { applyCors, sendError } from "../../lib/cors.js";
import { loadDay } from "../../lib/journal.js";
import { getServiceClient } from "../../lib/supabase.js";
import { asGrade, asTrimmed, isDateString } from "../../lib/validate.js";

function dateFrom(req: VercelRequest): string {
  const raw = req.query["date"];
  return Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
}

/**
 * GET /api/journal/[date] — day with file bodies (404 when untouched).
 * PUT /api/journal/[date] — upsert { grade: 1..10|null, status }.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (applyCors(req, res)) return;
  const date = dateFrom(req);
  if (!isDateString(date)) {
    sendError(res, 400, "bad_request", "date must be YYYY-MM-DD.");
    return;
  }

  if (req.method === "GET") {
    const userId = await authorizedUser(req, res);
    if (!userId) return;
    const supabase = getServiceClient();
    const day = await loadDay(supabase, userId, date, true);
    if (!day) {
      sendError(res, 404, "not_found", "No journal entry for this date.");
      return;
    }
    res.status(200).json(day);
    return;
  }

  if (req.method === "PUT") {
    const userId = await authorizedUser(req, res);
    if (!userId) return;
    const body = readJsonBody(req);
    const grade = asGrade(body["grade"]);
    if (Number.isNaN(grade)) {
      sendError(res, 400, "bad_request", "grade must be 1..10 or null.");
      return;
    }
    if (body["status"] !== undefined && typeof body["status"] !== "string") {
      sendError(res, 400, "bad_request", "status must be a string.");
      return;
    }
    const status = asTrimmed(body["status"]).slice(0, 40);

    const supabase = getServiceClient();
    const { error } = await supabase.from("journal_days").upsert(
      {
        user_id: userId,
        day: date,
        grade: grade ?? null,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,day" },
    );
    if (error) {
      sendError(res, 500, "server_error", "Could not save the journal day.");
      return;
    }
    const day = await loadDay(supabase, userId, date, true);
    res.status(200).json(day);
    return;
  }

  res.setHeader("Allow", "GET, PUT");
  sendError(res, 405, "method_not_allowed", "Only GET and PUT are allowed");
}
