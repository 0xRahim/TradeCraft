import type { AuthError, Session, User } from "@supabase/supabase-js";

export type PublicUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  emailConfirmed: boolean;
};

export type PublicSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number | null;
  token_type: string;
};

export function toPublicUser(user: User | null): PublicUser | null {
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName =
    typeof meta["full_name"] === "string" ? meta["full_name"] : null;
  return {
    id: user.id,
    email: user.email ?? null,
    fullName,
    emailConfirmed: (user.confirmed_at ?? null) !== null,
  };
}

export function toPublicSession(session: Session | null): PublicSession | null {
  if (!session) return null;
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    expires_at: session.expires_at ?? null,
    token_type: session.token_type,
  };
}

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^\S+@\S+\.\S+$/.test(value);
}

/**
 * Map a Supabase AuthError onto our `{ error: { code, message } }`
 * envelope status. Returns [status, code].
 */
export function mapAuthError(error: AuthError): [number, string] {
  const msg = (error.message ?? "").toLowerCase();
  if (
    msg.includes("already registered") ||
    msg.includes("already exists") ||
    msg.includes("user already")
  ) {
    return [409, "conflict"];
  }
  if (
    msg.includes("invalid login credentials") ||
    msg.includes("invalid credentials") ||
    msg.includes("email not confirmed")
  ) {
    return [401, "invalid_credentials"];
  }
  if (msg.includes("expired") || msg.includes("invalid") && msg.includes("token")) {
    return [401, "invalid_token"];
  }
  if (
    msg.includes("password") &&
    (msg.includes("short") || msg.includes("weak") || msg.includes("at least"))
  ) {
    return [400, "weak_password"];
  }
  return [400, "auth_error"];
}

/** Read a JSON body defensively (Vercel usually pre-parses it). */
export function readJsonBody(req: { body?: unknown }): Record<string, unknown> {
  const body = req.body;
  if (body && typeof body === "object") return body as Record<string, unknown>;
  if (typeof body === "string" && body.length > 0) {
    try {
      const parsed: unknown = JSON.parse(body);
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
}
