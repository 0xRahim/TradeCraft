"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth/auth-context";
import type { ExecutionRow } from "@/lib/dashboard/execution-csv";
import { createRng } from "@/lib/dashboard/seed";
import { makeThumb, type TradeRecord } from "@/lib/dashboard/trade-record";
import { getAllTradeRecords, getLocalUserTrades } from "@/lib/dashboard/trade-store";
import {
  JOURNAL_KEY,
  LEGACY_JOURNAL_KEY,
  loadJournal,
  type JournalData,
} from "@/lib/dashboard/journal-store";
import {
  LEGACY_NEW_TRADES_KEY,
  NEW_TRADES_KEY,
} from "@/lib/dashboard/trade-options";

/**
 * Remote-first data layer over the tradecraft-api. The UI never talks to
 * Supabase directly; every function here goes through `apiFetch` (which
 * attaches the session access token). localStorage remains the offline
 * fallback and the migration source.
 */

// ---------- wire types ----------

export type ApiExecution = {
  id: string;
  brokerOrderId: string;
  symbol: string;
  side: string;
  openTime: string;
  closeTime: string;
  volume: number;
  openPrice: number;
  closePrice: number;
  stopLoss: number;
  takeProfit: number;
  swap: number;
  commission: number;
  profit: number;
  reason: string;
};

export type ApiShot = {
  id: string;
  name: string;
  storagePath: string | null;
  srcUrl: string | null;
  tvUrl: string | null;
};

export type ApiTradeRecord = Omit<
  TradeRecord,
  "thumb" | "source" | "executions" | "entryShots" | "tradeShots"
> & {
  source: "user";
  executions: ApiExecution[];
  entryShots: ApiShot[];
  tradeShots: ApiShot[];
};

export type TradeListResponse = {
  data: ApiTradeRecord[];
  total: number;
  limit: number;
  offset: number;
};

export type DashboardPayload = {
  period: number;
  kpis: { label: string; value: string; tone: string; delta: string; vs: string }[];
  equity: { label: string; value: number }[];
  calendar: {
    month: string;
    total: number;
    wins: number;
    losses: number;
    best: number;
    days: { date: string; pnl: number }[];
  };
  tradeModels: { name: string; count: number }[];
  entryModels: { name: string; count: number }[];
  sessions: {
    hours: { h: number; london: number; frankfurt: number; newyork: number }[];
    london: number;
    frankfurt: number;
    newyork: number;
  };
  radar: { axis: string; score: number }[];
  tradeCount: number;
};

export type JournalFileJson = { id: string; name: string; body?: string };
export type JournalDayJson = {
  date: string;
  grade: number | null;
  status: string;
  files: JournalFileJson[];
};
export type JournalMonthJson = {
  days: Record<
    string,
    { grade: number | null; status: string; files: { id: string; name: string }[] }
  >;
};

// ---------- trades ----------

const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;

export function listTrades(params: {
  status?: string;
  model?: string;
  pair?: string;
  session?: string;
  q?: string;
  sort?: string;
  dir?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<TradeListResponse> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  }
  const suffix = qs.size ? `?${qs.toString()}` : "";
  return apiFetch<TradeListResponse>(`/trades${suffix}`);
}

export function getTrade(id: string): Promise<ApiTradeRecord> {
  return apiFetch<ApiTradeRecord>(`/trades/${id}`);
}

export function createTrade(body: unknown): Promise<ApiTradeRecord> {
  return apiFetch<ApiTradeRecord>("/trades", { method: "POST", body });
}

export function deleteTrade(id: string): Promise<void> {
  return apiFetch<void>(`/trades/${id}`, { method: "DELETE" });
}

function apiExecutionToRow(e: ApiExecution): ExecutionRow {
  return {
    id: e.brokerOrderId || e.id,
    symbol: str(e.symbol),
    openTime: str(e.openTime),
    volume: num(e.volume),
    side: str(e.side, "—"),
    closeTime: str(e.closeTime),
    openPrice: num(e.openPrice),
    closePrice: num(e.closePrice),
    stopLoss: num(e.stopLoss),
    takeProfit: num(e.takeProfit),
    swap: num(e.swap),
    commission: num(e.commission),
    profit: num(e.profit),
    reason: str(e.reason),
  };
}

/**
 * Map an API record to a TradeRecord. `thumb` is regenerated (never stored);
 * shots keep only directly-renderable refs here — `storagePath` refs are
 * resolved separately via `useResolvedShots`.
 */
export function apiRecordToTradeRecord(rec: ApiTradeRecord): TradeRecord | null {
  if (!rec || typeof rec !== "object" || !str(rec.pair)) return null;
  const side = rec.side === "short" ? "short" : rec.side === "long" ? "long" : null;
  if (!side) return null;
  const outcome = rec.outcome === "TP" || rec.outcome === "SL" || rec.outcome === "BE"
    ? rec.outcome
    : "BE";
  const orderIds = Array.isArray(rec.orderIds)
    ? rec.orderIds.filter((x): x is string => typeof x === "string")
    : [];
  let executions = (Array.isArray(rec.executions) ? rec.executions : []).map(
    apiExecutionToRow,
  );
  if (!executions.length && orderIds.length) {
    executions = [
      {
        id: orderIds[0],
        symbol: rec.pair,
        openTime: str(rec.entryTime),
        volume: num(rec.lots),
        side: side === "long" ? "BUY" : "SELL",
        closeTime: str(rec.exitTime),
        openPrice: num(rec.openPrice),
        closePrice: num(rec.closePrice),
        stopLoss: num(rec.slPrice),
        takeProfit: num(rec.tpPrice),
        swap: num(rec.swap),
        commission: num(rec.commission),
        profit: num(rec.gross),
        reason: outcome,
      },
    ];
  }
  const t: TradeRecord = {
    id: str(rec.id),
    source: "user",
    pair: str(rec.pair),
    side,
    outcome,
    session: str(rec.session),
    prevDay: str(rec.prevDay),
    h4Trend: str(rec.h4Trend),
    phase: str(rec.phase),
    model: str(rec.model),
    mechanicsContext: str(rec.mechanicsContext),
    entries: (Array.isArray(rec.entries) ? rec.entries : []).filter(
      (x): x is string => typeof x === "string",
    ),
    execType: str(rec.execType),
    alignment: str(rec.alignment),
    pois: (Array.isArray(rec.pois) ? rec.pois : []).filter(
      (x): x is string => typeof x === "string",
    ),
    rr: str(rec.rr),
    rrCustom: str(rec.rrCustom),
    riskPct: str(rec.riskPct),
    riskCustom: str(rec.riskCustom),
    tradeDate: str(rec.tradeDate),
    inducementTime: str(rec.inducementTime),
    entryTime: str(rec.entryTime),
    exitTime: str(rec.exitTime),
    openPrice: num(rec.openPrice),
    slPrice: num(rec.slPrice),
    closePrice: num(rec.closePrice),
    tpPrice: num(rec.tpPrice),
    lots: num(rec.lots),
    pips: num(rec.pips),
    pipsPoints: rec.pipsPoints === true,
    gross: num(rec.gross),
    swap: num(rec.swap),
    commission: num(rec.commission),
    net: num(rec.net),
    validity:
      rec.validity === "invalid" ? "invalid" : rec.validity === "valid" ? "valid" : "",
    psychTags: (Array.isArray(rec.psychTags) ? rec.psychTags : []).filter(
      (x): x is string => typeof x === "string",
    ),
    psychNote: str(rec.psychNote),
    notes: str(rec.notes),
    orderIds,
    executions,
    entryShots: (Array.isArray(rec.entryShots) ? rec.entryShots : []).map((s) => ({
      name: str(s.name),
      ...(s.srcUrl ? { src: s.srcUrl } : {}),
      ...(s.tvUrl ? { tvUrl: s.tvUrl } : {}),
    })),
    tradeShots: (Array.isArray(rec.tradeShots) ? rec.tradeShots : []).map((s) => ({
      name: str(s.name),
      ...(s.srcUrl ? { src: s.srcUrl } : {}),
      ...(s.tvUrl ? { tvUrl: s.tvUrl } : {}),
    })),
    thumb: "",
    createdAt: str(rec.createdAt) || new Date().toISOString(),
  };
  const rrNum = t.rr === "custom" ? num(t.rrCustom) : num(t.rr);
  const rCap = t.outcome === "TP" ? rrNum || 0 : t.outcome === "SL" ? -1 : 0;
  const hash = [...t.id].reduce((x, c) => (x * 31 + c.charCodeAt(0)) >>> 0, 7);
  // Deterministic client-side thumb (mirrors trade-store normalization).
  t.thumb = makeThumb(
    {
      long: side === "long",
      plan: Math.max(1, Math.round(Math.abs(rCap)) || 1),
      r: rCap,
    },
    createRng(hash),
  );
  return t;
}

// Cached trade list (30s TTL) shared by the log + detail neighbor nav.
let listCache: { at: number; data: TradeRecord[] } | null = null;

export async function listRemoteTrades(): Promise<TradeRecord[]> {
  if (listCache && Date.now() - listCache.at < 30_000) return listCache.data;
  const res = await listTrades({ limit: 500 });
  const data = res.data.flatMap((r) => {
    const t = apiRecordToTradeRecord(r);
    return t ? [t] : [];
  });
  listCache = { at: Date.now(), data };
  return data;
}

export function invalidateTradeCache(): void {
  listCache = null;
}

/** Remote user trades (migration runs first). No demos, no local drafts. */
export async function loadRemoteUserTrades(): Promise<TradeRecord[]> {
  await ensureTradesMigrated();
  return listRemoteTrades();
}

/** Remote user trades plus unsynced local drafts (newest first). */
export async function loadTradeLog(): Promise<TradeRecord[]> {
  const remote = await loadRemoteUserTrades();
  const localUser = getLocalUserTrades();
  const remoteIds = new Set(remote.map((t) => t.id));
  return [...remote, ...localUser.filter((t) => !remoteIds.has(t.id))];
}

/**
 * Merged trade log for views: remote user trades + unsynced local drafts
 * when authed, otherwise the local list. Instant local paint, remote
 * upgrade when the session is ready.
 */
export function useTradeLog(): TradeRecord[] {
  const { status } = useAuth();
  const [remote, setRemote] = useState<TradeRecord[] | null>(null);
  useEffect(() => {
    if (status !== "authed") return;
    let cancelled = false;
    loadRemoteUserTrades()
      .then((r) => {
        if (!cancelled) setRemote(r);
      })
      .catch(() => {
        if (!cancelled) setRemote(null);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);
  const local = useMemo(() => getAllTradeRecords(), []);
  return useMemo(() => {
    if (status !== "authed" || !remote) return local;
    const localUser = getLocalUserTrades();
    const remoteIds = new Set(remote.map((t) => t.id));
    const unsynced = localUser.filter((t) => !remoteIds.has(t.id));
    return [...remote, ...unsynced];
  }, [remote, local, status]);
}

// ---------- migration (localStorage → API, once) ----------

const MIGRATED_TRADES_KEY = "tradecraft.migrated.trades.v1";
let migratePromise: Promise<void> | null = null;

function readLocalDrafts(): unknown[] {
  if (typeof window === "undefined") return [];
  try {
    const raw =
      window.localStorage.getItem(NEW_TRADES_KEY) ??
      window.localStorage.getItem(LEGACY_NEW_TRADES_KEY);
    if (!raw) return [];
    const all: unknown = JSON.parse(raw);
    return Array.isArray(all) ? all : [];
  } catch {
    return [];
  }
}

export function ensureTradesMigrated(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.localStorage.getItem(MIGRATED_TRADES_KEY)) return Promise.resolve();
  if (!migratePromise) {
    migratePromise = (async () => {
      const drafts = readLocalDrafts();
      if (!drafts.length) {
        window.localStorage.setItem(MIGRATED_TRADES_KEY, "1");
        return;
      }
      for (const d of drafts) {
        if (!d || typeof d !== "object") continue;
        const { id, ...rest } = d as Record<string, unknown>;
        void id;
        await createTrade(rest);
      }
      window.localStorage.removeItem(NEW_TRADES_KEY);
      window.localStorage.removeItem(LEGACY_NEW_TRADES_KEY);
      window.localStorage.setItem(MIGRATED_TRADES_KEY, "1");
      invalidateTradeCache();
    })().catch((err) => {
      migratePromise = null;
      throw err;
    });
  }
  return migratePromise;
}

// ---------- dashboard ----------

export function getDashboard(params: {
  period: number;
  month?: string;
  anchor?: number;
}): Promise<DashboardPayload> {
  const qs = new URLSearchParams({ period: String(params.period) });
  if (params.month) qs.set("month", params.month);
  if (params.anchor !== undefined) qs.set("anchor", String(params.anchor));
  return apiFetch<DashboardPayload>(`/dashboard?${qs.toString()}`);
}

/** Fetch remote dashboard data when authed, else null (caller keeps seeds). */
export function useRemoteDashboard(period: number, anchor = 0) {
  const { status } = useAuth();
  const [snapshot, setSnapshot] = useState<{
    data: DashboardPayload | null;
    error: string | null;
  }>({ data: null, error: null });
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    if (status !== "authed") return;
    let cancelled = false;
    getDashboard({ period, anchor })
      .then((d) => {
        if (!cancelled) setSnapshot({ data: d, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setSnapshot({
            data: null,
            error: err instanceof Error ? err.message : "Could not load the dashboard.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [status, period, anchor, nonce]);
  const reload = useMemo(
    () => () => {
      // Event-handler state updates are fine; the nonce retriggers the fetch.
      setSnapshot({ data: null, error: null });
      setNonce((n) => n + 1);
    },
    [],
  );
  const loading = status === "authed" && !snapshot.data && !snapshot.error;
  return { data: snapshot.data, loading, error: snapshot.error, reload };
}

// ---------- uploads ----------

export type SignUploadResponse = {
  path: string;
  signedUrl: string;
  token: string;
};

export function signUpload(input: {
  tradeId: string | null;
  kind: "entry" | "trade";
  filename: string;
}): Promise<SignUploadResponse> {
  return apiFetch<SignUploadResponse>("/uploads/sign", {
    method: "POST",
    body: input,
  });
}

export function signRead(path: string): Promise<{ path: string; signedUrl: string }> {
  return apiFetch<{ path: string; signedUrl: string }>(
    `/uploads/sign?path=${encodeURIComponent(path)}`,
  );
}

/** Upload one screenshot file; resolves to the trade-POST shot ref. */
export async function uploadShotFile(
  file: File,
  opts: { tradeId: string | null; kind: "entry" | "trade" },
): Promise<{ name: string; storagePath: string }> {
  const { path, signedUrl } = await signUpload({
    tradeId: opts.tradeId,
    kind: opts.kind,
    filename: file.name,
  });
  const res = await fetch(signedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status}).`);
  return { name: file.name, storagePath: path };
}

// Signed-read cache (URLs live 60s server-side; refresh after 50s).
const readCache = new Map<string, { url: string; at: number }>();

export async function resolveShotSrc(storagePath: string): Promise<string | null> {
  const hit = readCache.get(storagePath);
  if (hit && Date.now() - hit.at < 50_000) return hit.url;
  try {
    const { signedUrl } = await signRead(storagePath);
    readCache.set(storagePath, { url: signedUrl, at: Date.now() });
    return signedUrl;
  } catch {
    return null;
  }
}

export type ShotRef = { name: string; src?: string; tvUrl?: string };

/** Resolve wire shots (storagePath → signed URL) into renderable ShotRefs. */
export function useResolvedShots(shots: ApiShot[]): ShotRef[] {
  const base = useMemo(
    () =>
      shots.map((s) => ({
        id: s.id,
        name: s.name,
        ...(s.srcUrl ? { src: s.srcUrl } : {}),
        ...(s.tvUrl ? { tvUrl: s.tvUrl } : {}),
      })),
    [shots],
  );
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  useEffect(() => {
    const pending = shots.filter((s) => s.storagePath && !s.srcUrl);
    if (!pending.length) return;
    let cancelled = false;
    Promise.all(pending.map((s) => resolveShotSrc(s.storagePath as string))).then(
      (urls) => {
        if (cancelled) return;
        const next: Record<string, string> = {};
        pending.forEach((s, i) => {
          if (urls[i]) next[s.id] = urls[i] as string;
        });
        setOverrides(next);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [shots]);
  return useMemo(
    () =>
      base.map((s) => ({
        name: s.name,
        ...(s.src
          ? { src: s.src }
          : overrides[s.id]
            ? { src: overrides[s.id] }
            : {}),
        ...(s.tvUrl ? { tvUrl: s.tvUrl } : {}),
      })),
    [base, overrides],
  );
}

// ---------- journal ----------

export function getJournalMonth(month: string): Promise<JournalMonthJson> {
  return apiFetch<JournalMonthJson>(`/journal?month=${month}`);
}

export function getJournalDay(date: string): Promise<JournalDayJson> {
  return apiFetch<JournalDayJson>(`/journal/${date}`);
}

export function putJournalDay(
  date: string,
  body: { grade: number | null; status: string },
): Promise<JournalDayJson> {
  return apiFetch<JournalDayJson>(`/journal/${date}`, {
    method: "PUT",
    body,
  });
}

export function postJournalFile(
  date: string,
  body: { name: string; body: string },
): Promise<JournalFileJson> {
  return apiFetch<JournalFileJson>(`/journal/${date}/files`, {
    method: "POST",
    body,
  });
}

export function patchJournalFile(
  date: string,
  fileId: string,
  body: { name?: string; body?: string },
): Promise<JournalFileJson> {
  return apiFetch<JournalFileJson>(`/journal/${date}/files/${fileId}`, {
    method: "PATCH",
    body,
  });
}

export function deleteJournalFile(date: string, fileId: string): Promise<void> {
  return apiFetch<void>(`/journal/${date}/files/${fileId}`, {
    method: "DELETE",
  });
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function prevMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  d.setUTCMonth(d.getUTCMonth() - 1);
  return monthKey(d);
}

function journalDataFromRemote(
  days: { date: string; grade: number | null; status: string; files: JournalFileJson[] }[],
): JournalData {
  const out: JournalData = {};
  for (const d of days) {
    out[d.date] = {
      g: d.grade,
      o: d.status,
      files: d.files.map((f) => ({ id: f.id, n: f.name, b: f.body ?? "" })),
    };
  }
  return out;
}

const isUuidLike = (id: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

/**
 * Push local journal state to the API. `prev` is the last pushed state
 * (null = first push: PUT all days, PATCH known-uuid files, POST temp files).
 * Returns the updated state (temp ids replaced by server uuids).
 */
export async function pushJournal(
  prev: JournalData | null,
  next: JournalData,
): Promise<JournalData> {
  const out: JournalData = JSON.parse(JSON.stringify(next));
  for (const date of Object.keys(out)) {
    const day = out[date];
    await putJournalDay(date, { grade: day.g, status: day.o });
    const prevFiles = prev?.[date]?.files ?? [];
    const prevById = new Map(prevFiles.map((f) => [f.id, f]));
    const nextIds = new Set(day.files.map((f) => f.id));
    for (const f of day.files) {
      if (isUuidLike(f.id)) {
        const p = prevById.get(f.id);
        if (!prev || !p || p.n !== f.n || p.b !== f.b) {
          await patchJournalFile(date, f.id, { name: f.n, body: f.b });
        }
      } else {
        const created = await postJournalFile(date, { name: f.n, body: f.b });
        f.id = created.id;
      }
    }
    for (const p of prevFiles) {
      if (isUuidLike(p.id) && !nextIds.has(p.id)) {
        try {
          await deleteJournalFile(date, p.id);
        } catch {
          // Already gone — converge on next sync.
        }
      }
    }
  }
  return out;
}

/**
 * Pull recent journal history (newest-first walk-back, max 12 months,
 * bodies included). Returns null on network failure (caller keeps local).
 */
export async function pullJournal(): Promise<{
  data: JournalData;
  dates: Set<string>;
} | null> {
  try {
    const days: {
      date: string;
      grade: number | null;
      status: string;
      files: JournalFileJson[];
    }[] = [];
    const dates = new Set<string>();
    let key = monthKey(new Date());
    let emptyStreak = 0;
    for (let i = 0; i < 12 && emptyStreak < 3; i += 1) {
      const month = await getJournalMonth(key);
      const entries = Object.entries(month.days);
      if (!entries.length) {
        emptyStreak += 1;
        key = prevMonthKey(key);
        continue;
      }
      emptyStreak = 0;
      const full = await Promise.all(
        entries.map(([date]) => getJournalDay(date)),
      );
      for (const d of full) {
        dates.add(d.date);
        days.push(d);
      }
      key = prevMonthKey(key);
    }
    return { data: journalDataFromRemote(days), dates };
  } catch {
    return null;
  }
}

export function hasLocalJournal(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.localStorage.getItem(JOURNAL_KEY) != null ||
      window.localStorage.getItem(LEGACY_JOURNAL_KEY) != null
    );
  } catch {
    return false;
  }
}

export function localJournalSnapshot(): JournalData {
  return loadJournal();
}
