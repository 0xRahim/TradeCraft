"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { TradeFormView, type TradeFormPayload } from "@/components/dashboard/trade-form";
import { useAuth } from "@/lib/auth/auth-context";
import {
  apiRecordToTradeRecord,
  getTrade,
  invalidateTradeCache,
  updateTrade,
  useResolvedShots,
  useTradeLog,
  type ApiShot,
  type ApiTradeRecord,
} from "@/lib/dashboard/remote";
import { recordToDraft } from "@/lib/dashboard/trade-record";
import { updateLocalTrade } from "@/lib/dashboard/trade-store";
import { nextShotId, serializeShots, type Shot } from "@/lib/dashboard/trade-media";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Merge server shots with their resolved URLs, keeping ids + storage paths. */
function toFormShots(shots: ApiShot[], resolved: { src?: string; tvUrl?: string }[]): Shot[] {
  return shots.map((s, i) => {
    const tvUrl = resolved[i]?.tvUrl ?? s.tvUrl ?? undefined;
    return {
      id: s.id,
      name: s.name,
      src: resolved[i]?.src ?? "",
      ...(tvUrl ? { tvUrl } : {}),
      owned: false,
      ...(s.storagePath ? { storagePath: s.storagePath } : {}),
    };
  });
}

export function EditTradeView({ tradeId }: { tradeId: string }) {
  const { status } = useAuth();
  const log = useTradeLog();
  const [apiRec, setApiRec] = useState<ApiTradeRecord | null>(null);
  const [shotTimeout, setShotTimeout] = useState(false);

  // Direct fetch for deep links (list cache may not have this record yet).
  useEffect(() => {
    if (status !== "authed" || !UUID_RE.test(tradeId)) return;
    let cancelled = false;
    getTrade(tradeId)
      .then((r) => {
        if (!cancelled) setApiRec(r);
      })
      .catch(() => {
        if (!cancelled) setApiRec(null);
      });
    return () => {
      cancelled = true;
    };
  }, [status, tradeId]);

  const apiEntryShots = useMemo(() => apiRec?.entryShots ?? [], [apiRec]);
  const apiTradeShots = useMemo(() => apiRec?.tradeShots ?? [], [apiRec]);
  const resolvedEntry = useResolvedShots(apiEntryShots);
  const resolvedTrade = useResolvedShots(apiTradeShots);

  // Don't hold the form forever if a storage URL fails to resolve.
  useEffect(() => {
    if (!apiRec) return;
    const t = setTimeout(() => setShotTimeout(true), 4000);
    return () => clearTimeout(t);
  }, [apiRec]);

  const t = useMemo(() => {
    if (apiRec) return apiRecordToTradeRecord(apiRec);
    return log.find((x) => x.id === tradeId);
  }, [apiRec, log, tradeId]);

  const shotsReady =
    !apiRec ||
    shotTimeout ||
    [...resolvedEntry, ...resolvedTrade].every((s) => s.src || s.tvUrl);

  const initial = useMemo(() => {
    if (!t) return null;
    if (apiRec) {
      return {
        draft: recordToDraft(t),
        execs: t.executions,
        entryShots: toFormShots(apiEntryShots, resolvedEntry),
        tradeShots: toFormShots(apiTradeShots, resolvedTrade),
      };
    }
    const local = (refs: { name: string; src?: string; tvUrl?: string }[]): Shot[] =>
      refs.map((r) => ({
        id: nextShotId(),
        name: r.name,
        src: r.src ?? "",
        ...(r.tvUrl ? { tvUrl: r.tvUrl } : {}),
        owned: false,
      }));
    return {
      draft: recordToDraft(t),
      execs: t.executions,
      entryShots: local(t.entryShots),
      tradeShots: local(t.tradeShots),
    };
  }, [t, apiRec, apiEntryShots, apiTradeShots, resolvedEntry, resolvedTrade]);

  if (!t || t.source !== "user") {
    return (
      <>
        <Topbar crumb={<>Trade log / <b className="font-medium text-foreground">Not found</b></>} />
        <div className="rounded-lg border border-border bg-card px-4 py-16 text-center text-muted-foreground">
          {t ? "Only journaled trades can be edited." : "This trade could not be found."}
          <div className="mt-4">
            <Link href="/trades" className="text-sm text-foreground hover:underline hover:underline-offset-4">
              Back to trade log
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (!initial || !shotsReady) {
    return (
      <>
        <Topbar crumb={<>Trade log / <b className="font-medium text-foreground">Edit trade</b></>} />
        <div className="rounded-lg border border-border bg-card px-4 py-16 text-center text-muted-foreground">
          Loading trade…
        </div>
      </>
    );
  }

  async function persistRemoteEdit(payload: TradeFormPayload) {
    await updateTrade(tradeId, {
      ...payload.draft,
      net: payload.net,
      executions: payload.executions,
      entryShots: payload.entryRefs,
      tradeShots: payload.tradeRefs,
    });
    invalidateTradeCache();
  }

  function persistLocalEdit(payload: TradeFormPayload) {
    updateLocalTrade(tradeId, {
      ...payload.draft,
      id: tradeId,
      net: payload.net,
      executions: payload.executions,
      entryShots: serializeShots(payload.entryShots),
      tradeShots: serializeShots(payload.tradeShots),
      savedAt: t?.createdAt ?? new Date().toISOString(),
    });
  }

  return (
    <TradeFormView
      key={tradeId}
      mode="edit"
      initialDraft={initial.draft}
      initialExecs={initial.execs}
      initialEntryShots={initial.entryShots}
      initialTradeShots={initial.tradeShots}
      title="Edit trade"
      subtitle={`${t.pair} · executions are locked — edit the journal fields below.`}
      crumbBold="Edit trade"
      backHref={`/trades/${tradeId}`}
      backLabel="Back to trade"
      syncTitle="Orders & executions"
      syncSub="Linked executions are locked on edit"
      submitLabel="Save changes"
      resetLabel="Reset changes"
      successNote="Trade updated. Redirecting back…"
      offlineNote="Updated locally (offline). Redirecting back…"
      redirectTo={`/trades/${tradeId}`}
      uploadTradeId={UUID_RE.test(tradeId) ? tradeId : null}
      persistRemote={persistRemoteEdit}
      persistLocal={persistLocalEdit}
    />
  );
}
