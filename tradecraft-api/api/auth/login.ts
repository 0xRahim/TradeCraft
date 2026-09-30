import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  isValidEmail,
  mapAuthError,
  readJsonBody,
  toPublicSession,
  toPublicUser,
} from "../../lib/auth-helpers.js";
import { applyCors, sendError } from "../../lib/cors.js";
import { getAnonClient } from "../../lib/supabase-public.js";

/**
 * POST /api/auth/login
 * Body: { email, password }
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
  const email = body["email"];
  const password = body["password"];

  if (!isValidEmail(email)) {
    sendError(res, 400, "bad_request", "Enter a valid email address.");
    return;
  }
  if (typeof password !== "string" || password.length === 0) {
    sendError(res, 400, "bad_request", "Enter your password.");
    return;
  }

  let supabase;
  try {
    supabase = getAnonClient();
  } catch {
    sendError(res, 500, "server_misconfigured", "Auth is not configured");
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    if (error) {
      const [status, code] = mapAuthError(error);
      // Normalize unknown sign-in failures to 401.
      sendError(
        res,
        status === 400 ? 401 : status,
        status === 400 ? "invalid_credentials" : code,
        "Invalid email or password.",
      );
      return;
    }
    sendError(res, 401, "invalid_credentials", "Invalid email or password.");
    return;
  }

  res.status(200).json({
    user: toPublicUser(data.user),
    session: toPublicSession(data.session),
  });
}
