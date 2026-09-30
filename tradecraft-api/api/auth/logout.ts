import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, sendError } from "../../lib/cors.js";
import { getServiceClient } from "../../lib/supabase.js";

/**
 * POST /api/auth/logout
 * Best-effort server-side sign-out (revokes the token when the
 * service-role key is configured). The client must discard its stored
 * session regardless. Always 200 { signedOut: true }.
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

  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (token) {
    try {
      const admin = getServiceClient();
      await admin.auth.admin.signOut(token);
    } catch {
      // Best effort — service-role key may not be configured yet;
      // the client clears local state either way.
    }
  }
  res.status(200).json({ signedOut: true });
}
