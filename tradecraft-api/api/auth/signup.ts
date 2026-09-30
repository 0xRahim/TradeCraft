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
 * POST /api/auth/signup
 * Body: { name?, email, password }
 * 201 { user, session } — or 200 { user, confirmationRequired: true }
 * when email confirmations are enabled in Supabase Auth.
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
  const name = typeof body["name"] === "string" ? body["name"].trim() : "";
  const email = body["email"];
  const password = body["password"];

  if (!isValidEmail(email)) {
    sendError(res, 400, "bad_request", "Enter a valid email address.");
    return;
  }
  if (typeof password !== "string" || password.length < 8) {
    sendError(res, 400, "bad_request", "Use at least 8 characters.");
    return;
  }

  let supabase;
  try {
    supabase = getAnonClient();
  } catch {
    sendError(res, 500, "server_misconfigured", "Auth is not configured");
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: name ? { data: { full_name: name } } : undefined,
  });

  if (error) {
    const [status, code] = mapAuthError(error);
    sendError(res, status, code, error.message);
    return;
  }

  // Email-confirmations-on + duplicate email: Supabase returns a user with
  // no identities and no session instead of an error. Treat as conflict.
  if (data.user && !data.session) {
    const identities = (data.user as { identities?: unknown }).identities;
    if (Array.isArray(identities) && identities.length === 0) {
      sendError(res, 409, "conflict", "An account with this email already exists.");
      return;
    }
  }

  if (data.session) {
    res.status(201).json({
      user: toPublicUser(data.user),
      session: toPublicSession(data.session),
    });
    return;
  }

  res.status(200).json({
    user: toPublicUser(data.user),
    session: null,
    confirmationRequired: true,
  });
}
