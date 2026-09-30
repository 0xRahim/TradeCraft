import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authorizedUser } from "../lib/auth.js";
import { applyCors, sendError } from "../lib/cors.js";
import { loadDayFiles } from "../lib/journal.js";
import { getServiceClient } from "../lib/supabase.js";
import { isMonthString } from "../lib/validate.js";

function currentMonthUTC(): string {
  const now = new Date();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}-${m}`;
}

function nextMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, 1));
  next.setUTCMonth(next.getUTCMonth() + 1);
  const mm = String(next.getUTCMonth() + 1).padStart(2, "0");
  return `${next.getUTCFullYear()}-${mm}`;
}

/**
 * GET /api/journal?month=YYYY-MM
 * Month overview without file bodies.
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

  const rawMonth = req.query["month"];
  const month =
    typeof rawMonth === "string" && rawMonth ? rawMonth : currentMonthUTC();
  if (!isMonthString(month)) {
    sendError(res, 400, "bad_request", "month must be YYYY-MM.");
    return;
  }

  const supabase = getServiceClient();
  const { data: days, error } = await supabase
    .from("journal_days")
    .select("id, day, grade, status")
    .eq("user_id", userId)
    .gte("day", `${month}-01`)
    .lt("day", `${nextMonth(month)}-01`)
    .order("day", { ascending: true });
  if (error) {
    sendError(res, 500, "server_error", "Could not load the journal.");
    return;
  }

  const rows = (days ?? []) as {
    id: string;
    day: string;
    grade: number | null;
    status: string;
  }[];
  const out: Record<
    string,
    { grade: number | null; status: string; files: { id: string; name: string }[] }
  > = {};
  await Promise.all(
    rows.map(async (d) => {
      const files = await loadDayFiles(supabase, d.id, false);
      out[d.day] = {
        grade: d.grade,
        status: d.status ?? "",
        files: files.map((f) => ({ id: f.id, name: f.name })),
      };
    }),
  );
  res.status(200).json({ days: out });
}
