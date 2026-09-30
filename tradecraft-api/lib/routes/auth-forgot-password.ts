import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  isValidEmail,
  readJsonBody,
} from "../auth-helpers.js";
import { applyCors, sendError } from "../cors.js";
import { getAnonClient, getFrontendUrl } from "../supabase-public.js";

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 * Always 200 { sent: true } to avoid account enumeration.
 */
export async function handleAuthForgotPassword(
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
  const email = body["email"];
  if (!isValidEmail(email)) {
    sendError(res, 400, "bad_request", "Enter a valid email address.");
    return;
  }

  let supabase;
  try {
    supabase = getAnonClient();
  } catch {
    sendError(res, 500, "server_misconfigured", "Auth is not configured");
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getFrontendUrl()}/reset-password`,
  });

  // Never reveal whether the email exists — return success regardless.
  if (error) {
    console.error("forgot-password error:", error.message);
  }
  res.status(200).json({ sent: true });
}
