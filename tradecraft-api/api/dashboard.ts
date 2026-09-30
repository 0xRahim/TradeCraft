import type { VercelRequest, VercelResponse } from "@vercel/node";
import { computeDashboard, type AggTrade } from "../lib/aggregate.js";
import { authorizedUser } from "../lib/auth.js";
import { applyCors, sendError } from "../lib/cors.js";
import { getServiceClient } from "../lib/supabase.js";
import { asPeriod, isMonthString } from "../lib/validate.js";

function currentMonthUTC(): string {
  const now = new Date();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}-${m}`;
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function strArr(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : [];
}

/**
 * GET /api/dashboard?period=7|30|60|90|180&month=YYYY-MM&anchor=
 * Aggregates over the caller's trades. See API.md for the formulas.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (applyCors(req, res)) return;
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    sendError(res, 405, "method_not_allowed", "Only GET is allowed");
    return;
  }
  const userId = await authorizedUser(req, res);
  if (!userId) return;

  const q = req.query ?? {};
  const period = asPeriod(
    Array.isArray(q["period"]) ? q["period"][0] : q["period"],
  );
  const rawMonth = Array.isArray(q["month"]) ? q["month"][0] : q["month"];
  const month =
    typeof rawMonth === "string" && rawMonth ? rawMonth : currentMonthUTC();
  if (!isMonthString(month)) {
    sendError(res, 400, "bad_request", "month must be YYYY-MM.");
    return;
  }
  const rawAnchor = Array.isArray(q["anchor"]) ? q["anchor"][0] : q["anchor"];
  const anchor =
    rawAnchor === undefined || rawAnchor === "" ? 0 : Number(rawAnchor);
  if (!Number.isFinite(anchor)) {
    sendError(res, 400, "bad_request", "anchor must be a number.");
    return;
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("trades")
    .select(
      "trade_date, outcome, net, rr, rr_custom, model, entries, session, entry_time",
    )
    .eq("user_id", userId)
    .order("trade_date", { ascending: true })
    .limit(5000);
  if (error) {
    sendError(res, 500, "server_error", "Could not compute the dashboard.");
    return;
  }

  const trades: AggTrade[] = ((data ?? []) as Record<string, unknown>[]).map(
    (r) => ({
      tradeDate:
        r["trade_date"] == null || r["trade_date"] === ""
          ? null
          : str(r["trade_date"]),
      outcome: str(r["outcome"]),
      net: num(r["net"]),
      rr: str(r["rr"]),
      rrCustom: str(r["rr_custom"]),
      model: str(r["model"]),
      entries: strArr(r["entries"]),
      session: str(r["session"]),
      entryTime: str(r["entry_time"]),
    }),
  );

  res.status(200).json(computeDashboard(trades, period, month, anchor));
}
