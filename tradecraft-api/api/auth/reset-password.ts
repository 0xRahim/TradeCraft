import { createClient, type User } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { mapAuthError, readJsonBody, toPublicUser } from "../../lib/auth-helpers.js";
import { applyCors, sendError } from "../../lib/cors.js";

/**
 * POST /api/auth/reset-password
 * Completes a recovery flow started by /auth/forgot-password.
 *
 * Body (any one of):
 * - { password, code } — PKCE code from the email link (?code=…)
 * - { password, access_token, refresh_token } — tokens from the link hash
 * - Header `Authorization: Bearer <recovery access token>` + { password }
 *
 * 200 { user }
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
  const password = body["password"];
  if (typeof password !== "string" || password.length < 8) {
    sendError(res, 400, "bad_request", "Use at least 8 characters.");
    return;
  }

  const code = typeof body["code"] === "string" ? body["code"] : "";
  const accessToken =
    typeof body["access_token"] === "string" ? body["access_token"] : "";
  const refreshToken =
    typeof body["refresh_token"] === "string" ? body["refresh_token"] : "";
  const header = req.headers.authorization ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";

  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) {
    sendError(res, 500, "server_misconfigured", "Auth is not configured");
    return;
  }

  // Fresh client per request so recovery sessions never leak across calls.
  const scoped = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (code) {
    const { error } = await scoped.auth.exchangeCodeForSession(code);
    if (error) {
      const [, errCode] = mapAuthError(error);
      sendError(res, 401, errCode, "This reset link is invalid or has expired.");
      return;
    }
  } else if (accessToken && refreshToken) {
    const { error } = await scoped.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      const [, errCode] = mapAuthError(error);
      sendError(res, 401, errCode, "This reset link is invalid or has expired.");
      return;
    }
  } else if (bearer) {
    // updateUser() has no jwt option in this SDK version, so call the
    // Auth REST endpoint directly with the recovery token.
    try {
      const resp = await fetch(`${url}/auth/v1/user`, {
        method: "PUT",
        headers: {
          apikey: key,
          Authorization: `Bearer ${bearer}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });
      if (!resp.ok) {
        sendError(
          res,
          401,
          "invalid_token",
          "This reset link is invalid or has expired.",
        );
        return;
      }
      const body_: unknown = await resp.json();
      const record =
        body_ && typeof body_ === "object"
          ? (body_ as { user?: User })
          : null;
      const user: User | null =
        record !== null && record.user && typeof record.user === "object"
          ? record.user
          : (body_ as User);
      const safeUser =
        user !== null && typeof user === "object" && typeof user.id === "string"
          ? user
          : null;
      res.status(200).json({ user: toPublicUser(safeUser) });
      return;
    } catch {
      sendError(res, 500, "server_error", "Password reset failed. Try again.");
      return;
    }
  } else {
    sendError(
      res,
      401,
      "invalid_token",
      "Missing recovery session. Open the reset link from your email again.",
    );
    return;
  }

  const { data, error } = await scoped.auth.updateUser({ password });
  if (error) {
    const [, errCode] = mapAuthError(error);
    sendError(res, 400, errCode, error.message);
    return;
  }
  res.status(200).json({ user: toPublicUser(data.user) });
}
