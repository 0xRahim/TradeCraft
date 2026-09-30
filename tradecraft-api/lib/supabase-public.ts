import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Anon/public client for self-service auth operations
 * (signup, login, refresh, recovery). Server-only env vars —
 * never expose these to the browser. The UI talks to this API,
 * never to Supabase directly.
 */
export function getAnonClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL / SUPABASE_ANON_KEY env vars");
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** Frontend base URL used as the recovery redirect target. */
export function getFrontendUrl(): string {
  return process.env["FRONTEND_URL"] ?? "http://localhost:3000";
}
