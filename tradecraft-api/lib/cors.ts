import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * TODO(production): switch back to the allowlist before public deploy —
 * open CORS must not ship to prod. Flip `ALLOW_ALL` to false and set
 * FRONTEND_URL to the production UI origin.
 */
const ALLOW_ALL = true;

/** Allowed origins: FRONTEND_URL plus localhost:3000 in dev. */
export function getAllowedOrigins(): string[] {
  const origins = new Set<string>();
  const frontend = process.env["FRONTEND_URL"];
  if (frontend) origins.add(frontend);
  if (process.env["NODE_ENV"] !== "production") {
    origins.add("http://localhost:3000");
  }
  return [...origins];
}

/**
 * Apply CORS headers. Returns true when the request was an OPTIONS
 * preflight that has been fully handled (caller should `return`).
 */
export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  if (ALLOW_ALL) {
    // Temporary dev setting: allow all origins. NOTE: `*` cannot be
    // combined with Allow-Credentials, so no credentials header here.
    // Auth travels via the Authorization header, not cookies.
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else {
    const origin = req.headers.origin;
    const allowed = getAllowedOrigins();
    if (origin && allowed.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

export function sendError(
  res: VercelResponse,
  status: number,
  code: string,
  message: string,
): void {
  res.status(status).json({ error: { code, message } });
}
