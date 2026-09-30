import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getServiceClient } from "./supabase.js";
import { sendError } from "./cors.js";

export class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Verify the Supabase access token from `Authorization: Bearer <token>`
 * and return the authenticated user id. Throws HttpError(401) when
 * missing or invalid. All queries must then scope to this user id.
 */
export async function requireUser(req: VercelRequest): Promise<string> {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    throw new HttpError(401, "unauthorized", "Missing access token");
  }
  const supabase = getServiceClient();
  const { data, error } = await supabase.auth.getUser(token);
  const userId = data?.user?.id;
  if (error || !userId) {
    throw new HttpError(401, "unauthorized", "Invalid access token");
  }
  return userId;
}

/**
 * requireUser() for handlers: sends the 401 envelope and returns null
 * when authentication fails, so handlers stay flat.
 */
export async function authorizedUser(
  req: VercelRequest,
  res: VercelResponse,
): Promise<string | null> {
  try {
    return await requireUser(req);
  } catch (err) {
    if (err instanceof HttpError) {
      sendError(res, err.status, err.code, err.message);
      return null;
    }
    sendError(res, 500, "server_error", "Authentication failed.");
    return null;
  }
}
