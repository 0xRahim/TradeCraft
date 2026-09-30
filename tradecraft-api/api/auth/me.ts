import type { VercelRequest, VercelResponse } from "@vercel/node";
import { toPublicUser } from "../../lib/auth-helpers.js";
import { requireUser } from "../../lib/auth.js";
import { applyCors, sendError } from "../../lib/cors.js";
import { getServiceClient } from "../../lib/supabase.js";
import { getAnonClient } from "../../lib/supabase-public.js";

/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <access token>
 * 200 { user } — validates the session for route guards / boot.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (applyCors(req, res)) return;
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    sendError(res, 405, "method_not_allowed", "Only GET is allowed");
    return;
  }

  try {
    await requireUser(req);
  } catch {
    sendError(res, 401, "unauthorized", "Invalid access token");
    return;
  }

  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  // Prefer the service-role verifier when configured; fall back to the
  // anon client so auth works before the service-role key is added.
  let user = null;
  try {
    const admin = getServiceClient();
    const { data } = await admin.auth.getUser(token);
    user = data?.user ?? null;
  } catch {
    const anon = getAnonClient();
    const { data } = await anon.auth.getUser(token);
    user = data?.user ?? null;
  }

  if (!user) {
    sendError(res, 401, "unauthorized", "Invalid access token");
    return;
  }
  res.status(200).json({ user: toPublicUser(user) });
}
