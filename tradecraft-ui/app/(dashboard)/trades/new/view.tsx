"use client";

import { TradeFormView, type TradeFormPayload } from "@/components/dashboard/trade-form";
import { NEW_TRADES_KEY, EMPTY_DRAFT } from "@/lib/dashboard/trade-options";
import { serializeShots } from "@/lib/dashboard/trade-media";
import { createTrade, invalidateTradeCache } from "@/lib/dashboard/remote";

function persistLocalCreate(payload: TradeFormPayload) {
  const raw = window.localStorage.getItem(NEW_TRADES_KEY);
  const all = raw ? (JSON.parse(raw) as unknown[]) : [];
  all.push({
    ...payload.draft,
    id: `u-${Date.now()}`,
    net: payload.net,
    executions: payload.executions,
    entryShots: serializeShots(payload.entryShots),
    tradeShots: serializeShots(payload.tradeShots),
    savedAt: new Date().toISOString(),
  });
  window.localStorage.setItem(NEW_TRADES_KEY, JSON.stringify(all));
}

async function persistRemoteCreate(payload: TradeFormPayload) {
  await createTrade({
    ...payload.draft,
    net: payload.net,
    executions: payload.executions,
    entryShots: payload.entryRefs,
    tradeShots: payload.tradeRefs,
  });
  invalidateTradeCache();
}

export function NewTradeView() {
  return (
    <TradeFormView
      mode="create"
      initialDraft={EMPTY_DRAFT}
      title="New trade"
      subtitle="Sync executions from CSV or MT5 report, then journal the idea."
      crumbBold="New trade"
      backHref="/trades"
      backLabel="Back to log"
      syncTitle="Sync & orders"
      syncSub="Upload CSV or MT5 report to sync order / execution history"
      submitLabel="Save trade"
      resetLabel="Clear form"
      successNote="Trade saved. Redirecting to the trade log…"
      offlineNote="Saved locally (offline). Redirecting to the trade log…"
      redirectTo="/trades"
      uploadTradeId={null}
      persistRemote={persistRemoteCreate}
      persistLocal={persistLocalCreate}
    />
  );
}
