"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth/auth-context";
import {
  createTrade,
  invalidateTradeCache,
  uploadShotFile,
} from "@/lib/dashboard/remote";
import { Topbar } from "@/components/dashboard/topbar";import {
  Field,
  PillMulti,
  PillSingle,
  ShotField,
  inputCls,
  textAreaCls,
} from "@/components/dashboard/trade-form-bits";
import { Card, CardHeader, Chip } from "@/components/dashboard/ui";
import { Icon } from "@/components/dashboard/icons";
import {
  capturedR,
  movePips,
  nearestRrPreset,
  suggestSession,
} from "@/lib/dashboard/trade-derivations";
import {
  parseBrokerTime,
  parseExecutionCsv,
  toDateInput,
  toTimeInput,
  type ExecutionRow,
} from "@/lib/dashboard/execution-csv";
import {
  revokeShots,
  serializeShots,
  type Shot,
} from "@/lib/dashboard/trade-media";
import {
  ALIGNMENTS,
  EMPTY_DRAFT,
  ENTRIES,
  EXEC_TYPES,
  H4_TREND,
  MODELS,
  NEW_TRADES_KEY,
  PAIRS,
  PHASES,
  POIS,
  PREV_DAY,
  PSYCH_TAGS,
  RISK_PRESETS,
  RR_PRESETS,
  SESSIONS,
  type NewTradeDraft,
} from "@/lib/dashboard/trade-options";

const SIDES = [
  { value: "long", label: "Long" },
  { value: "short", label: "Short" },
] as const;

const OUTCOMES = [
  { value: "TP", label: "TP" },
  { value: "SL", label: "SL" },
  { value: "BE", label: "BE" },
] as const;

const VALIDITY = [
  { value: "valid", label: "Valid" },
  { value: "invalid", label: "Invalid" },
] as const;

const fmt = (n: number, dp = 5): string =>
  Number.isFinite(n) ? String(Number(n.toFixed(dp))) : "";

function mode(values: (string | number)[]): string {
  const freq = new Map<string, number>();
  for (const v of values) {
    const k = String(v);
    if (!k || k === "0") continue;
    freq.set(k, (freq.get(k) ?? 0) + 1);
  }
  let best = "";
  let bestN = 0;
  for (const [k, n] of freq) {
    if (n > bestN) {
      best = k;
      bestN = n;
    }
  }
  return best;
}

export function NewTradeView() {
  const router = useRouter();
  const { status } = useAuth();
  const [draft, setDraft] = useState<NewTradeDraft>(EMPTY_DRAFT);
  const [execs, setExecs] = useState<ExecutionRow[]>([]);
  const [csvError, setCsvError] = useState("");
  const [entryShots, setEntryShots] = useState<Shot[]>([]);
  const [tradeShots, setTradeShots] = useState<Shot[]>([]);
  const [saved, setSaved] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof NewTradeDraft>(k: K, v: NewTradeDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const toggleList = (key: "entries" | "pois" | "psychTags", v: string) =>
    setDraft((d) => {
      const cur = d[key];
      return { ...d, [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] };
    });

  const selected = useMemo(
    () => execs.filter((e) => draft.orderIds.includes(e.id)),
    [execs, draft.orderIds],
  );

  const symbols = useMemo(
    () => [...new Set(selected.map((s) => s.symbol).filter(Boolean))],
    [selected],
  );
  const sides = useMemo(
    () => [...new Set(selected.map((s) => s.side).filter(Boolean))],
    [selected],
  );
  const mixedSymbol = symbols.length > 1;
  const mixedSide = sides.length > 1;

  function applySelection(ids: string[], rows: ExecutionRow[]) {
    const sel = rows.filter((e) => ids.includes(e.id));
    const vol = sel.reduce((x, r) => x + r.volume, 0);
    const open = vol ? sel.reduce((x, r) => x + r.openPrice * r.volume, 0) / vol : 0;
    const close = vol ? sel.reduce((x, r) => x + r.closePrice * r.volume, 0) / vol : 0;
    const gross = sel.reduce((x, r) => x + r.profit, 0);
    const swap = sel.reduce((x, r) => x + r.swap, 0);
    const comm = sel.reduce((x, r) => x + r.commission, 0);
    const reasons = [...new Set(sel.map((r) => r.reason).filter(Boolean))];
    const syms = [...new Set(sel.map((r) => r.symbol).filter(Boolean))];
    const sds = [...new Set(sel.map((r) => r.side).filter(Boolean))];
    const times = sel
      .map((r) => parseBrokerTime(r.openTime))
      .filter((d): d is Date => !!d)
      .sort((a, b) => a.getTime() - b.getTime());
    const closes = sel
      .map((r) => parseBrokerTime(r.closeTime))
      .filter((d): d is Date => !!d)
      .sort((a, b) => a.getTime() - b.getTime());
    const slMode = sel.length ? mode(sel.map((r) => r.stopLoss)) : "";
    const tpMode = sel.length ? mode(sel.map((r) => r.takeProfit)) : "";
    const rCap = sel.length ? capturedR(open, Number(slMode), close) : null;
    const rrPreset = nearestRrPreset(rCap);
    const symbol = syms.length === 1 ? syms[0] : "";
    const moved = sel.length && symbol ? movePips(symbol, open, close) : { value: "", points: false };
    const sessionGuess =
      times.length && sel.length ? suggestSession(times[0].getHours()) : "";
    setDraft((d) => ({
      ...d,
      orderIds: ids,
      openPrice: sel.length ? fmt(open) : d.openPrice,
      closePrice: sel.length ? fmt(close) : d.closePrice,
      slPrice: sel.length ? slMode || d.slPrice : d.slPrice,
      tpPrice: sel.length ? tpMode || d.tpPrice : d.tpPrice,
      lots: sel.length ? fmt(vol, 2) : d.lots,
      pips: sel.length ? moved.value || d.pips : d.pips,
      pipsPoints: sel.length ? moved.points : d.pipsPoints,
      gross: sel.length ? fmt(gross, 2) : d.gross,
      swap: sel.length ? fmt(swap, 2) : d.swap,
      commission: sel.length ? fmt(comm, 2) : d.commission,
      rr: sel.length && rCap != null ? (rrPreset ?? "custom") : d.rr,
      rrCustom: sel.length && rCap != null && !rrPreset ? fmt(rCap, 2) : d.rrCustom,
      session: sessionGuess || d.session,
      sessionAuto: Boolean(sessionGuess),
      pair: syms.length === 1 ? syms[0] : d.pair,
      side:
        sds.length === 1
          ? sds[0] === "BUY"
            ? "long"
            : sds[0] === "SELL"
              ? "short"
              : d.side
          : d.side,
      outcome: reasons.length === 1 && (reasons[0] === "TP" || reasons[0] === "SL") ? reasons[0] : d.outcome,
      tradeDate: times.length ? toDateInput(times[0]) : d.tradeDate,
      entryTime: times.length ? toTimeInput(times[0]) : d.entryTime,
      exitTime: closes.length ? toTimeInput(closes[closes.length - 1]) : d.exitTime,
    }));
  }

  function toggleOrder(id: string) {
    const ids = draft.orderIds.includes(id)
      ? draft.orderIds.filter((x) => x !== id)
      : [...draft.orderIds, id];
    applySelection(ids, execs);
  }

  function onCsvText(text: string) {
    try {
      const rows = parseExecutionCsv(text);
      if (!rows.length) {
        setCsvError("No execution rows found. Check the CSV format.");
        return;
      }
      setCsvError("");
      setExecs(rows);
    } catch {
      setCsvError("Could not parse this CSV file.");
    }
  }

  /* Net P&L follows gross + swap + commission unless overridden. */
  const autoNet = useMemo(() => {
    const g = Number(draft.gross) || 0;
    const s = Number(draft.swap) || 0;
    const c = Number(draft.commission) || 0;
    const has = draft.gross !== "" || draft.swap !== "" || draft.commission !== "";
    return has ? fmt(g + s + c, 2) : "";
  }, [draft.gross, draft.swap, draft.commission]);
  const netShown = draft.netOverride ? draft.net : autoNet;

  const errors: string[] = [];
  if (!draft.pair) errors.push("Select a pair.");
  if (!draft.side) errors.push("Select long or short.");
  if (!draft.orderIds.length) errors.push("Select at least one order ID.");
  if (!draft.outcome) errors.push("Select a status (TP / SL / BE).");
  if (!draft.session) errors.push("Select a session.");
  if (!draft.tradeDate) errors.push("Pick a trade date.");
  if (draft.model === "market-mechanics" && !draft.mechanicsContext.trim())
    errors.push("Describe the market mechanic you observed.");
  if (mixedSide) errors.push("Selected orders mix BUY and SELL — confirm the side.");

  /** Convert form shots to API refs, uploading owned files first. */
  async function toShotRefs(
    shots: Shot[],
    kind: "entry" | "trade",
  ): Promise<{ name: string; storagePath?: string; srcUrl?: string; tvUrl?: string }[]> {
    const out: {
      name: string;
      storagePath?: string;
      srcUrl?: string;
      tvUrl?: string;
    }[] = [];
    for (const s of shots) {
      if (s.file) {
        const uploaded = await uploadShotFile(s.file, { tradeId: null, kind });
        out.push({ name: uploaded.name, storagePath: uploaded.storagePath });
      } else if (s.src.startsWith("http")) {
        out.push({
          name: s.name,
          srcUrl: s.src,
          ...(s.tvUrl ? { tvUrl: s.tvUrl } : {}),
        });
      } else if (s.tvUrl) {
        out.push({ name: s.name, tvUrl: s.tvUrl });
      } else {
        out.push({ name: s.name });
      }
    }
    return out;
  }

  function saveLocal(note: string) {
    try {
      const raw = window.localStorage.getItem(NEW_TRADES_KEY);
      const all = raw ? (JSON.parse(raw) as unknown[]) : [];
      all.push({
        ...draft,
        id: `u-${Date.now()}`,
        net: netShown,
        executions: selected,
        entryShots: serializeShots(entryShots),
        tradeShots: serializeShots(tradeShots),
        savedAt: new Date().toISOString(),
      });
      window.localStorage.setItem(NEW_TRADES_KEY, JSON.stringify(all));
    } catch {
      /* storage unavailable — still redirect */
    }
    setSaved(note);
    setTimeout(() => router.push("/trades"), 600);
  }

  async function save() {
    if (errors.length || saving) return;
    setSaveError("");
    if (status !== "authed") {
      saveLocal("Trade saved. Redirecting to the trade log…");
      return;
    }
    setSaving(true);
    try {
      const [entryRefs, tradeRefs] = await Promise.all([
        toShotRefs(entryShots, "entry"),
        toShotRefs(tradeShots, "trade"),
      ]);
      await createTrade({
        ...draft,
        net: netShown,
        executions: selected,
        entryShots: entryRefs,
        tradeShots: tradeRefs,
      });
      invalidateTradeCache();
      setSaved("Trade saved. Redirecting to the trade log…");
      setTimeout(() => router.push("/trades"), 600);
    } catch (err) {
      if (err instanceof ApiError && err.code === "network_error") {
        // Offline with a session — keep the trade locally instead of losing it.
        saveLocal("Saved locally (offline). Redirecting to the trade log…");
        return;
      }
      setSaveError(
        err instanceof ApiError ? err.message : "Could not save the trade.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Topbar
        crumb={
          <>
            Trade log / <b className="font-medium text-foreground">New trade</b>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl leading-8 font-medium tracking-tight">New trade</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Sync executions from CSV, then journal the idea.
          </p>
        </div>
        <Link
          href="/trades"
          className="flex h-9 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Icon name="list" />
          Back to log
        </Link>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-4">
          {/* 1 — Sync & orders */}
          <Card>
            <CardHeader
              title="Sync & orders"
              sub="Upload CSV to sync order / execution history"
              right={execs.length ? <Chip variant="neutral">{execs.length} rows</Chip> : undefined}
            />
            <div className="grid gap-3">
              <label className="flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-input px-3 py-4 text-center text-sm text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground">
                <span className="font-medium text-foreground">Upload execution CSV</span>
                <span className="font-mono text-xs">ID, Symbol, Open Time, Volume, Side, … Profit, Reason</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void f.text().then(onCsvText);
                    e.target.value = "";
                  }}
                />
              </label>
              {csvError ? <p className="text-sm text-loss">{csvError}</p> : null}
              {execs.length ? (
                <div className="-mx-4 overflow-x-auto px-1">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {["", "Order ID", "Symbol", "Side", "Vol", "Open", "Close", "P&L", "Reason"].map(
                          (h, i) => (
                            <th
                              key={h || i}
                              className="border-b border-border px-3 py-2 text-left font-mono text-xs font-medium tracking-widest whitespace-nowrap text-muted-foreground uppercase"
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {execs.map((r) => {
                        const on = draft.orderIds.includes(r.id);
                        return (
                          <tr key={r.id} className={on ? "bg-surface-high" : undefined}>
                            <td className="border-b border-border px-3 py-2">
                              <input
                                type="checkbox"
                                checked={on}
                                onChange={() => toggleOrder(r.id)}
                                aria-label={`Select order ${r.id}`}
                                className="size-4 accent-current"
                              />
                            </td>
                            <td className="border-b border-border px-3 py-2 font-mono text-xs whitespace-nowrap">
                              {r.id}
                            </td>
                            <td className="border-b border-border px-3 py-2 font-mono text-xs">{r.symbol}</td>
                            <td className="border-b border-border px-3 py-2 font-mono text-xs">{r.side}</td>
                            <td className="border-b border-border px-3 py-2 text-right font-mono text-xs">{r.volume}</td>
                            <td className="border-b border-border px-3 py-2 text-right font-mono text-xs">{r.openPrice}</td>
                            <td className="border-b border-border px-3 py-2 text-right font-mono text-xs">{r.closePrice}</td>
                            <td className="border-b border-border px-3 py-2 text-right font-mono text-xs">{r.profit}</td>
                            <td className="border-b border-border px-3 py-2">
                              <Chip variant={r.reason === "TP" ? "profit" : r.reason === "SL" ? "loss" : "outline"}>
                                {r.reason || "—"}
                              </Chip>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Pair">
                  <select
                    aria-label="Pair"
                    value={draft.pair}
                    onChange={(e) => set("pair", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select pair…</option>
                    {PAIRS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {mixedSymbol ? (
                    <p className="text-xs text-warning">Multiple symbols selected — confirm the pair.</p>
                  ) : null}
                </Field>
                <Field label="Direction">
                  <PillSingle options={SIDES} value={draft.side} onChange={(v) => set("side", v)} ariaLabel="Long or short" />
                  {mixedSide ? (
                    <p className="text-xs text-warning">Orders mix BUY and SELL.</p>
                  ) : null}
                </Field>
                <Field label="Status" hint="TP / SL / BE">
                  <PillSingle options={OUTCOMES} value={draft.outcome} onChange={(v) => set("outcome", v)} ariaLabel="Trade status" />
                </Field>
              </div>
              {draft.orderIds.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {draft.orderIds.map((id) => (
                    <Chip key={id}>
                      {id}
                      <button
                        type="button"
                        aria-label={`Remove order ${id}`}
                        onClick={() => toggleOrder(id)}
                        className="ml-1 hover:text-foreground"
                      >
                        ×
                      </button>
                    </Chip>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>

          {/* 2 — Context */}
          <Card>
            <CardHeader title="Trade context" sub="Session, bias and market phase" />
            <div className="grid gap-3 md:grid-cols-2">
              <Field
                label="Session"
                hint={
                  draft.sessionAuto && draft.session
                    ? "Auto · suggested from entry time (UTC) — change if needed"
                    : undefined
                }
              >
                <PillSingle
                  options={SESSIONS}
                  value={draft.session}
                  onChange={(v) => {
                    set("session", v);
                    set("sessionAuto", false);
                  }}
                  ariaLabel="Session"
                />
              </Field>
              <Field label="Previous day candle close">
                <PillSingle
                  options={PREV_DAY}
                  value={draft.prevDay}
                  onChange={(v) => set("prevDay", v)}
                  ariaLabel="Previous day candle"
                />
              </Field>
              <Field label="Higher timeframe trend · H4 structure">
                <PillSingle
                  options={H4_TREND}
                  value={draft.h4Trend}
                  onChange={(v) => set("h4Trend", v)}
                  ariaLabel="H4 trend"
                />
              </Field>
              <Field label="Market phase">
                <PillSingle
                  options={PHASES}
                  value={draft.phase}
                  onChange={(v) => set("phase", v)}
                  ariaLabel="Market phase"
                />
              </Field>
            </div>
          </Card>

          {/* 3 — Condition & entry */}
          <Card>
            <CardHeader title="Condition & entry" sub="Model, entry models and POI" />
            <div className="grid gap-4">
              <Field label="Condition · Model">
                <PillSingle
                  options={MODELS}
                  value={draft.model}
                  onChange={(v) => set("model", v)}
                  ariaLabel="Condition model"
                />
              </Field>
              {draft.model === "market-mechanics" ? (
                <Field label="Market mechanics context" hint="Describe the market mechanic you observed">
                  <textarea
                    value={draft.mechanicsContext}
                    onChange={(e) => set("mechanicsContext", e.target.value)}
                    rows={3}
                    placeholder="What mechanic played out and why it mattered…"
                    aria-label="Market mechanics context"
                    className={textAreaCls}
                  />
                </Field>
              ) : null}
              <Field label="Entry models" hint="Multi-select allowed">
                <PillMulti
                  options={ENTRIES}
                  values={draft.entries}
                  onToggle={(v) => toggleList("entries", v)}
                  ariaLabel="Entry models"
                />
              </Field>
              <ShotField
                label="Entry model screenshot"
                hint="PNG / JPG · upload, paste, or TradingView link"
                shots={entryShots}
                onChange={setEntryShots}
                uploadLabel="Upload entry screenshot"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Type of execution">
                  <PillSingle
                    options={EXEC_TYPES}
                    value={draft.execType}
                    onChange={(v) => set("execType", v)}
                    ariaLabel="Execution type"
                  />
                </Field>
                <Field label="Trend alignment">
                  <PillSingle
                    options={ALIGNMENTS}
                    value={draft.alignment}
                    onChange={(v) => set("alignment", v)}
                    ariaLabel="Trend alignment"
                  />
                </Field>
              </div>
              <Field label="Type of POI" hint="Multi-select allowed">
                <PillMulti
                  options={POIS}
                  values={draft.pois}
                  onToggle={(v) => toggleList("pois", v)}
                  ariaLabel="POI types"
                />
              </Field>
            </div>
          </Card>

          {/* 4 — Risk */}
          <Card>
            <CardHeader title="Risk" sub="Risk-reward and risk percentage" />
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Risk-reward"
                hint={
                  draft.orderIds.length && draft.rr
                    ? "Auto · captured R from selected orders — change if needed"
                    : undefined
                }
              >
                <PillSingle
                  options={[...RR_PRESETS.map((n) => ({ value: String(n), label: `1:${n}` })), { value: "custom", label: "Custom" }] as const}
                  value={draft.rr}
                  onChange={(v) => set("rr", v)}
                  ariaLabel="Risk reward"
                />
                {draft.rr === "custom" ? (
                  <input
                    value={draft.rrCustom}
                    onChange={(e) => set("rrCustom", e.target.value)}
                    inputMode="decimal"
                    placeholder="Custom R, e.g. 2.5"
                    aria-label="Custom risk reward"
                    className={inputCls}
                  />
                ) : null}
              </Field>
              <Field label="Risk percentage">
                <PillSingle
                  options={[...RISK_PRESETS.map((n) => ({ value: String(n), label: `${n}%` })), { value: "custom", label: "Custom" }] as const}
                  value={draft.riskPct}
                  onChange={(v) => set("riskPct", v)}
                  ariaLabel="Risk percentage"
                />
                {draft.riskPct === "custom" ? (
                  <input
                    value={draft.riskCustom}
                    onChange={(e) => set("riskCustom", e.target.value)}
                    inputMode="decimal"
                    placeholder="Custom %, e.g. 1.5"
                    aria-label="Custom risk percentage"
                    className={inputCls}
                  />
                ) : null}
              </Field>
            </div>
          </Card>

          {/* 5 — Date, timing, prices */}
          <Card>
            <CardHeader title="Date, timing & prices" sub="Auto-fetched from order IDs — editable" />
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Trade date">
                <input
                  type="date"
                  value={draft.tradeDate}
                  onChange={(e) => set("tradeDate", e.target.value)}
                  aria-label="Trade date"
                  className={inputCls}
                />
              </Field>
              <Field label="Inducement time">
                <input
                  type="time"
                  value={draft.inducementTime}
                  onChange={(e) => set("inducementTime", e.target.value)}
                  aria-label="Inducement time"
                  className={inputCls}
                />
              </Field>
              <Field label="Entry time">
                <input
                  type="time"
                  value={draft.entryTime}
                  onChange={(e) => set("entryTime", e.target.value)}
                  aria-label="Entry time"
                  className={inputCls}
                />
              </Field>
              <Field label="Exit time">
                <input
                  type="time"
                  value={draft.exitTime}
                  onChange={(e) => set("exitTime", e.target.value)}
                  aria-label="Exit time"
                  className={inputCls}
                />
              </Field>
              <Field label="Open price">
                <input
                  value={draft.openPrice}
                  onChange={(e) => set("openPrice", e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-label="Open price"
                  className={`${inputCls} font-mono`}
                />
              </Field>
              <Field label="SL price">
                <input
                  value={draft.slPrice}
                  onChange={(e) => set("slPrice", e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-label="SL price"
                  className={`${inputCls} font-mono`}
                />
              </Field>
              <Field label="Close price">
                <input
                  value={draft.closePrice}
                  onChange={(e) => set("closePrice", e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-label="Close price"
                  className={`${inputCls} font-mono`}
                />
              </Field>
              <Field label="TP price">
                <input
                  value={draft.tpPrice}
                  onChange={(e) => set("tpPrice", e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-label="TP price"
                  className={`${inputCls} font-mono`}
                />
              </Field>
              <Field label="Trade size · lots">
                <input
                  value={draft.lots}
                  onChange={(e) => set("lots", e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-label="Trade size lots"
                  className={`${inputCls} font-mono`}
                />
              </Field>
              <Field
                label="Trade size · pips"
                hint={
                  draft.orderIds.length && draft.pips
                    ? draft.pipsPoints
                      ? "Auto · price points (no pip convention for this symbol)"
                      : "Auto · price moved, |close − open| in pips"
                    : undefined
                }
              >
                <input
                  value={draft.pips}
                  onChange={(e) => set("pips", e.target.value)}
                  inputMode="decimal"
                  placeholder="0.0"
                  aria-label="Trade size pips"
                  className={`${inputCls} font-mono`}
                />
              </Field>
            </div>
          </Card>

          {/* 6 — Outcome */}
          <Card>
            <CardHeader title="Outcome" sub="P&L and validity" />
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Gross P&L">
                <input
                  value={draft.gross}
                  onChange={(e) => set("gross", e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-label="Gross P&L"
                  className={`${inputCls} font-mono`}
                />
              </Field>
              <Field label="Swap">
                <input
                  value={draft.swap}
                  onChange={(e) => set("swap", e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-label="Swap"
                  className={`${inputCls} font-mono`}
                />
              </Field>
              <Field label="Commission">
                <input
                  value={draft.commission}
                  onChange={(e) => set("commission", e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-label="Commission"
                  className={`${inputCls} font-mono`}
                />
              </Field>
              <Field label="Net P&L" hint={draft.netOverride ? "Manual override on" : "Auto: gross + swap + commission"}>
                <input
                  value={netShown}
                  onChange={(e) => set("net", e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-label="Net P&L"
                  className={`${inputCls} font-mono`}
                />
                <button
                  type="button"
                  onClick={() => set("netOverride", !draft.netOverride)}
                  className="text-left text-xs text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4"
                >
                  {draft.netOverride ? "Re-enable auto-calc" : "Override manually"}
                </button>
              </Field>
              <Field label="Validity">
                <PillSingle
                  options={VALIDITY}
                  value={draft.validity}
                  onChange={(v) => set("validity", v)}
                  ariaLabel="Validity"
                />
              </Field>
            </div>
          </Card>

          {/* 7 — Journal */}
          <Card>
            <CardHeader title="Journal" sub="Psychology, notes and media" />
            <div className="grid gap-4">
              <Field label="Psychology tags" hint="Multi-select allowed">
                <PillMulti
                  options={PSYCH_TAGS}
                  values={draft.psychTags}
                  onToggle={(v) => toggleList("psychTags", v)}
                  ariaLabel="Psychology tags"
                />
              </Field>
              <Field label="Psychology note" hint="Describe what happened">
                <textarea
                  value={draft.psychNote}
                  onChange={(e) => set("psychNote", e.target.value)}
                  rows={2}
                  placeholder="What triggered it, what you did…"
                  aria-label="Psychology note"
                  className={textAreaCls}
                />
              </Field>
              <Field label="Notes">
                <textarea
                  value={draft.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={4}
                  placeholder="Trade review, lessons, follow-ups…"
                  aria-label="Trade notes"
                  className={textAreaCls}
                />
              </Field>
              <ShotField
                label="Trade screenshots"
                hint="PNG / JPG · upload, paste, or TradingView link"
                shots={tradeShots}
                onChange={setTradeShots}
                uploadLabel="Upload trade screenshots"
              />
            </div>
          </Card>
        </div>

        {/* Summary rail */}
        <aside className="grid min-w-0 gap-4 xl:sticky xl:top-4">
          <Card>
            <CardHeader title="Summary" sub="Live preview" />
            <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-sm">
              {[
                ["Pair", draft.pair || "—"],
                ["Side", draft.side || "—"],
                ["Orders", draft.orderIds.length ? String(draft.orderIds.length) : "—"],
                ["Status", draft.outcome || "—"],
                ["Net P&L", netShown || "—"],
                ["Lots", draft.lots || "—"],
                ["Date", draft.tradeDate || "—"],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-mono">{v}</dd>
                </div>
              ))}
            </dl>
            {errors.length ? (
              <ul className="mt-3 grid gap-1 border-t border-border pt-3 text-xs text-loss">
                {errors.map((e) => (
                  <li key={e}>• {e}</li>
                ))}
              </ul>
            ) : null}
            {saved ? <p className="mt-3 text-xs text-profit">{saved}</p> : null}
            {saveError ? (
              <p role="alert" className="mt-3 text-xs text-loss">
                {saveError}
              </p>
            ) : null}
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={save}
                disabled={errors.length ? true : saving}
                className="h-9 rounded-lg bg-primary text-sm font-medium text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-ring"
              >
                {saving ? "Saving…" : "Save trade"}
              </button>
              <button
                type="button"
                onClick={() => {
                  revokeShots(entryShots);
                  revokeShots(tradeShots);
                  setDraft(EMPTY_DRAFT);
                  setEntryShots([]);
                  setTradeShots([]);
                  setSaved("");
                  setSaveError("");
                }}
                className="h-9 rounded-lg border border-border text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
              >
                Clear form
              </button>
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}
