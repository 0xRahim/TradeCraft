import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  mapAuthError,
  readJsonBody,
  toPublicSession,
  toPublicUser,
} from "../../lib/auth-helpers.js";
import { applyCors, sendError } from "../../lib/cors.js";
import { getAnonClient } from "../../lib/supabase-public.js";

/**
 * POST /api/auth/refresh
 * Body: { refresh_token }
 * 200 { user, session }
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (applyCors(req, res)) return;
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendError(res, 405, "method_not_allowed", "Only POST is allowed");
    return;
  }

  const body = readJsonBody(req);
  const refreshToken = body["refresh_token"];
  if (typeof refreshToken !== "string" || refreshToken.length === 0) {
    sendError(res, 400, "bad_request", "Missing refresh token.");
    return;
  }

  let supabase;
  try {
    supabase = getAnonClient();
  } catch {
    sendError(res, 500, "server_misconfigured", "Auth is not configured");
    return;
  }

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    if (error) {
      const [, code] = mapAuthError(error);
      sendError(res, 401, code, "Session expired. Please log in again.");
      return;
    }
    sendError(res, 401, "invalid_token", "Session expired. Please log in again.");
    return;
  }

  res.status(200).json({
    user: toPublicUser(data.user),
    session: toPublicSession(data.session),
  });
}
