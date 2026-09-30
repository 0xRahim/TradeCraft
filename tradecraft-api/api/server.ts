import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, sendError } from "../lib/cors.js";
import { handleAuthForgotPassword } from "../lib/routes/auth-forgot-password.js";
import { handleAuthLogin } from "../lib/routes/auth-login.js";
import { handleAuthLogout } from "../lib/routes/auth-logout.js";
import { handleAuthMe } from "../lib/routes/auth-me.js";
import { handleAuthRefresh } from "../lib/routes/auth-refresh.js";
import { handleAuthResetPassword } from "../lib/routes/auth-reset-password.js";
import { handleAuthSignup } from "../lib/routes/auth-signup.js";
import { handleDashboard } from "../lib/routes/dashboard.js";
import { handleHealth } from "../lib/routes/health.js";
import { handleJournal } from "../lib/routes/journal.js";
import { handleJournalDate } from "../lib/routes/journal-date.js";
import { handleJournalFile } from "../lib/routes/journal-file.js";
import { handleJournalFiles } from "../lib/routes/journal-files.js";
import { handleTradeById } from "../lib/routes/trades-id.js";
import { handleTrades } from "../lib/routes/trades.js";
import { handleUploadsSign } from "../lib/routes/uploads-sign.js";

/**
 * Single serverless entry point for the whole API (Vercel Hobby 12-function
 * limit). `vercel.json` rewrites every `/api/:path` request here while the
 * browser-facing URL stays unchanged, so the frontend is unaffected.
 *
 * Each route delegates to the handler in `lib/routes/` (moved verbatim from
 * the old per-file api functions). Those handlers keep reading
 * path params from `req.query` (`id`, `date`, `fileId`) exactly as before —
 * this router synthesizes them from the URL before delegating.
 */

function first(value: unknown): string {
  return Array.isArray(value) ? (value[0] ?? "") : ((value as string) ?? "");
}

/** Original `/api/...` pathname, regardless of how the rewrite reached us. */
function originalPathname(req: VercelRequest): string {
  const rawUrl = typeof req.url === "string" && req.url ? req.url : "/api/server";
  let pathname = rawUrl.split("?")[0] ?? "/api/server";

  // 1. Explicitly forwarded by the vercel.json rewrite
  //    (`/api/:path*` → `/api/server?__rewritePath=:path*`).
  const forwarded = first(
    (req.query as Record<string, unknown> | undefined)?.["__rewritePath"],
  );
  if (forwarded) {
    pathname = `/api/${forwarded.replace(/^\/+/, "")}`;
  } else if (pathname === "/api/server" || pathname === "/api/server/") {
    // 2. Direct hit on the function URL — check rewrite hint headers.
    const header =
      req.headers["x-vercel-rewrite-url"] ?? req.headers["x-now-route-matches"];
    if (typeof header === "string" && header.startsWith("/api/")) {
      pathname = header.split("?")[0] ?? pathname;
    }
  }
  // 3. Otherwise `req.url` already carries the original path (Vercel
  //    preserves it in some rewrite modes) — use it as-is.

  // Normalize: strip a single trailing slash (`/api/trades/` ≡ `/api/trades`).
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }
  return pathname;
}

/**
 * Merge extracted path params into `req.query` (Vercel used to do this for
 * `[id]`/`[date]`/`[fileId]` files) and drop the internal rewrite key so
 * downstream handlers see the same shape as before.
 */
function withParams(
  req: VercelRequest,
  params: Record<string, string>,
): void {
  const query = { ...((req.query as Record<string, unknown> | undefined) ?? {}) };
  delete query["__rewritePath"];
  Object.assign(query, params);
  (req as { query?: unknown }).query = query;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (applyCors(req, res)) return;

  const pathname = originalPathname(req);
  const seg = pathname.startsWith("/api/") ? pathname.slice("/api/".length) : null;
  if (seg === null) {
    sendError(res, 404, "not_found", "Not found.");
    return;
  }
  const parts = seg.split("/");

  // /api/health
  if (seg === "health") {
    handleHealth(req, res);
    return;
  }

  // /api/auth/*
  if (parts[0] === "auth" && parts.length === 2) {
    switch (parts[1]) {
      case "login":
        await handleAuthLogin(req, res);
        return;
      case "signup":
        await handleAuthSignup(req, res);
        return;
      case "logout":
        await handleAuthLogout(req, res);
        return;
      case "me":
        await handleAuthMe(req, res);
        return;
      case "refresh":
        await handleAuthRefresh(req, res);
        return;
      case "forgot-password":
        await handleAuthForgotPassword(req, res);
        return;
      case "reset-password":
        await handleAuthResetPassword(req, res);
        return;
    }
  }

  // /api/trades
  if (seg === "trades") {
    await handleTrades(req, res);
    return;
  }

  // /api/trades/:id (most-specific before siblings — only child here)
  if (parts[0] === "trades" && parts.length === 2 && parts[1]) {
    withParams(req, { id: parts[1] ?? "" });
    await handleTradeById(req, res);
    return;
  }

  // /api/dashboard
  if (seg === "dashboard") {
    await handleDashboard(req, res);
    return;
  }

  // /api/journal
  if (seg === "journal") {
    await handleJournal(req, res);
    return;
  }

  // /api/journal/:date/files/:fileId (longest first)
  if (
    parts[0] === "journal" &&
    parts.length === 4 &&
    parts[2] === "files" &&
    parts[1] &&
    parts[3]
  ) {
    withParams(req, { date: parts[1] ?? "", fileId: parts[3] ?? "" });
    await handleJournalFile(req, res);
    return;
  }

  // /api/journal/:date/files
  if (parts[0] === "journal" && parts.length === 3 && parts[2] === "files" && parts[1]) {
    withParams(req, { date: parts[1] ?? "" });
    await handleJournalFiles(req, res);
    return;
  }

  // /api/journal/:date
  if (parts[0] === "journal" && parts.length === 2 && parts[1]) {
    withParams(req, { date: parts[1] ?? "" });
    await handleJournalDate(req, res);
    return;
  }

  // /api/uploads/sign
  if (seg === "uploads/sign") {
    await handleUploadsSign(req, res);
    return;
  }

  sendError(res, 404, "not_found", "Not found.");
}
