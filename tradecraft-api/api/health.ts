import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, sendError } from "../lib/cors.js";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (applyCors(req, res)) return;
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    sendError(res, 405, "method_not_allowed", "Only GET is allowed");
    return;
  }
  res.status(200).json({ ok: true, name: "tradecraft-api" });
}
