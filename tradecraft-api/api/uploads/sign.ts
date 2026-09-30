import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readJsonBody } from "../../lib/auth-helpers.js";
import { authorizedUser } from "../../lib/auth.js";
import { applyCors, sendError } from "../../lib/cors.js";
import { SHOTS_BUCKET } from "../../lib/storage-helpers.js";
import { getServiceClient } from "../../lib/supabase.js";
import { loadTradeRow } from "../../lib/trade-loader.js";
import { asShotKind, isUuid, sanitizeFilename } from "../../lib/validate.js";

/**
 * POST /api/uploads/sign — signed upload URL for a screenshot.
 * Body: { tradeId: uuid|null, kind: entry|trade, filename, contentType? }
 * path = {user_id}/{tradeId ?? "pending"}/{kind}/{safe filename}.
 * The client PUTs bytes to `signedUrl`, then references `path` as
 * `storagePath` in the trade POST/PATCH.
 *
 * GET /api/uploads/sign?path=… — short-lived signed read URL (60s).
 * The bucket stays private; `path` must start with the caller's user id.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (applyCors(req, res)) return;
  const userId = await authorizedUser(req, res);
  if (!userId) return;
  const supabase = getServiceClient();

  if (req.method === "POST") {
    const body = readJsonBody(req);
    const kind = asShotKind(body["kind"]);
    if (!kind) {
      sendError(res, 400, "bad_request", "kind must be entry or trade.");
      return;
    }
    const filename = sanitizeFilename(body["filename"]);
    const rawTradeId = body["tradeId"];
    let folder = "pending";
    if (typeof rawTradeId === "string" && rawTradeId && rawTradeId !== "pending") {
      if (!isUuid(rawTradeId)) {
        sendError(res, 400, "bad_request", "Invalid trade id.");
        return;
      }
      // Screenshots may only be uploaded against the caller's own trades.
      const trade = await loadTradeRow(supabase, userId, rawTradeId);
      if (!trade) {
        sendError(res, 404, "not_found", "Trade not found.");
        return;
      }
      folder = rawTradeId;
    }
    const path = `${userId}/${folder}/${kind}/${filename}`;
    const { data, error } = await supabase.storage
      .from(SHOTS_BUCKET)
      .createSignedUploadUrl(path, { upsert: true });
    if (error || !data) {
      const statusCode = (error as { statusCode?: string | number })?.statusCode;
      const msg = (error?.message ?? "").toLowerCase();
      if (
        statusCode === 404 ||
        statusCode === "404" ||
        (msg.includes("not found") && msg.includes("bucket")) ||
        msg.includes("bucket not found")
      ) {
        sendError(
          res,
          500,
          "storage_misconfigured",
          "Storage bucket trade-shots is missing. See STORAGE.md.",
        );
        return;
      }
      sendError(res, 500, "server_error", "Could not sign the upload.");
      return;
    }
    res.status(200).json({
      path: data.path,
      signedUrl: data.signedUrl,
      token: data.token,
    });
    return;
  }

  if (req.method === "GET") {
    const raw = req.query["path"];
    const path = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
    if (!path || !path.startsWith(`${userId}/`) || path.includes("..")) {
      sendError(res, 400, "bad_request", "Invalid storage path.");
      return;
    }
    const { data, error } = await supabase.storage
      .from(SHOTS_BUCKET)
      .createSignedUrl(path, 60);
    if (error || !data) {
      sendError(res, 404, "not_found", "Screenshot not found.");
      return;
    }
    res.status(200).json({ path, signedUrl: data.signedUrl });
    return;
  }

  res.setHeader("Allow", "GET, POST");
  sendError(res, 405, "method_not_allowed", "Only GET and POST are allowed");
}
