"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Chip, IconButton, MicroLabel } from "@/components/dashboard/ui";
import { Icon } from "@/components/dashboard/icons";
import { useAuth } from "@/lib/auth/auth-context";
import {
  apiRecordToTradeRecord,
  getTrade,
  useResolvedShots,
  useTradeLog,
  type ApiShot,
  type ApiTradeRecord,
} from "@/lib/dashboard/remote";
import {
  monthDayYear,
  rSigned,
  usdSigned,
} from "@/lib/dashboard/format";
import {
  alignLabel,
  entryLabels,
  execLabel,
  h4Label,
  modelLabel,
  phaseLabel,
  poiLabels,
  prevDayLabel,
  priceDp,
  psychLabels,
  recordR,
  recordResult,
  sessionLabel,
  type TradeRecord,
} from "@/lib/dashboard/trade-record";
import {
  OutcomeChip,
  SideChip,
  SourceChip,
  ValidityChip,
} from "../trade-bits";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toneText(n: number): string {
  return n > 0 ? "text-profit" : n < 0 ? "text-loss" : "";
}

function ShotGrid({ shots, label }: { shots: TradeRecord["entryShots"]; label: string }) {
  if (!shots.length) return null;
  return (
    <div>
      <MicroLabel>{label}</MicroLabel>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {shots.map((s, i) => (
          <div key={`${s.name}-${i}`} className="overflow-hidden rounded-md border border-border bg-background">
            {s.src ? (
              // Screenshots are user-provided / external snapshot URLs.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.src} alt={s.name} loading="lazy" className="h-28 w-full object-cover" />
            ) : s.tvUrl ? (
              <a
                href={s.tvUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-28 items-center justify-center p-2 text-center text-xs text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4"
              >
                Open TradingView snapshot
              </a>
            ) : (
              <div className="flex h-28 items-center justify-center p-2 text-center font-mono text-xs text-subtle-foreground">
                {s.name}
              </div>
            )}
            <div className="truncate px-2 py-1.5 font-mono text-[11px] text-muted-foreground">
              {s.tvUrl ? "TV · " : ""}{s.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TradeDetailView({ tradeId }: { tradeId: string }) {
  const router = useRouter();
  const { status } = useAuth();
  const log = useTradeLog();
  // Direct fetch for deep links (list cache may not have this record yet).
  const [apiRec, setApiRec] = useState<ApiTradeRecord | null>(null);
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
  const t = useMemo(() => {
    if (apiRec) return apiRecordToTradeRecord(apiRec);
    return log.find((x) => x.id === tradeId);
  }, [apiRec, log, tradeId]);
  // Screenshots: resolve private storage refs to signed URLs when remote.
  const apiEntryShots: ApiShot[] = apiRec ? apiRec.entryShots : [];
  const apiTradeShots: ApiShot[] = apiRec ? apiRec.tradeShots : [];
  const resolvedEntry = useResolvedShots(apiEntryShots);
  const resolvedTrade = useResolvedShots(apiTradeShots);
  const entryShots = apiRec ? resolvedEntry : (t?.entryShots ?? []);
  const tradeShots = apiRec ? resolvedTrade : (t?.tradeShots ?? []);
  const nav = useMemo(() => {
    const ix = log.findIndex((x) => x.id === tradeId);
    if (ix < 0) return {};
    return {
      ...(ix > 0 ? { prev: log[ix - 1].id } : {}),
      ...(ix < log.length - 1 ? { next: log[ix + 1].id } : {}),
    };
  }, [log, tradeId]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && nav.next) router.push(`/trades/${nav.next}`);
      if (e.key === "ArrowLeft" && nav.prev) router.push(`/trades/${nav.prev}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nav, router]);

  if (!t) {
    return (
      <>
        <Topbar crumb={<>Trade log / <b className="font-medium text-foreground">Not found</b></>} />
        <div className="rounded-lg border border-border bg-card px-4 py-16 text-center text-muted-foreground">
          This trade could not be found.
          <div className="mt-4">
            <Link href="/trades" className="text-sm text-foreground hover:underline hover:underline-offset-4">
              Back to trade log
            </Link>
          </div>
        </div>
      </>
    );
  }

  const dp = priceDp(t.pair);
  const f = (n: number) => n.toFixed(dp);
  const r = recordR(t);
  const res = recordResult(t);
  const riskDist = Math.abs(t.openPrice - t.slPrice);
  const planned = riskDist > 0 ? Math.abs(t.tpPrice - t.openPrice) / riskDist : null;
  const resTone = res === "win" ? "profit" : res === "loss" ? "loss" : "neutral";

  function copyOid(oid: string) {
    try {
      void navigator.clipboard.writeText(oid);
    } catch {
      /* ignore */
    }
    setCopied(oid);
    setTimeout(() => setCopied(null), 1000);
  }

  const go = (id?: string) => {
    if (id) router.push(`/trades/${id}`);
  };

  /* ladder: TP / Entry / SL positioned by relative price */
  const lo = Math.min(t.slPrice, t.openPrice, t.tpPrice);
  const hi = Math.max(t.slPrice, t.openPrice, t.tpPrice);
  const span = hi - lo || 1;
  const markers: { label: string; price: number; kind: "tp" | "en" | "sl" }[] = [
    { label: "TP", price: t.tpPrice, kind: "tp" },
    { label: "Entry", price: t.openPrice, kind: "en" },
    { label: "SL", price: t.slPrice, kind: "sl" },
  ];
  const hit = (k: string) => (t.outcome === "TP" ? k === "tp" : t.outcome === "SL" ? k === "sl" : false);

  const detailRows: [string, React.ReactNode][] = [
    ["Trade model", <span key="md" className="font-medium">{modelLabel(t.model) || "—"}</span>],
    ["Status", <OutcomeChip key="st" outcome={t.outcome} />],
    ["Direction", <SideChip key="dir" side={t.side} />],
    ["Session", <span key="se" className="font-medium">{sessionLabel(t.session) || "—"}</span>],
    ["H4 structure", <span key="h4" className="font-medium">{h4Label(t.h4Trend) || "—"}</span>],
    ["Prev-day close", <span key="pd" className="font-medium">{prevDayLabel(t.prevDay) || "—"}</span>],
    ["Market phase", <span key="ph" className="font-medium">{phaseLabel(t.phase) || "—"}</span>],
    ["Execution", <span key="ex" className="font-medium">{execLabel(t.execType) || "—"}</span>],
    ["Trend alignment", <span key="al" className="font-medium">{alignLabel(t.alignment) || "—"}</span>],
    [
      "Risk-reward",
      <span key="rr" className="font-mono text-sm">
        {t.rr === "custom" ? `1:${t.rrCustom || "—"}` : t.rr ? `1:${t.rr}` : "—"}
      </span>,
    ],
    [
      "Risk %",
      <span key="rk" className="font-mono text-sm">
        {t.riskPct === "custom" ? `${t.riskCustom || "—"}%` : t.riskPct ? `${t.riskPct}%` : "—"}
      </span>,
    ],
    ["Validity", <ValidityChip key="va" validity={t.validity} />],
  ];

  return (
    <>
      <Topbar
        crumb={
          <>
            Trade log / <b className="font-medium text-foreground">{t.pair}</b>
          </>
        }
      />

      <div className="mb-6">
        <Link
          href="/trades"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <Icon name="l" />
          Trade log
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl leading-8 font-medium tracking-tight">{t.pair}</h1>
          <SideChip side={t.side} />
          <Chip variant={resTone}>{t.outcome === "BE" ? "BREAKEVEN" : t.outcome === "TP" ? "TAKE PROFIT" : "STOP LOSS"}</Chip>
          <ValidityChip validity={t.validity} />
          <SourceChip source={t.source} />
          <div className="ml-auto flex items-center gap-2">
            <IconButton label="Previous trade" disabled={!nav.prev} onClick={() => go(nav.prev)}>
              <Icon name="l" />
            </IconButton>
            <IconButton label="Next trade" disabled={!nav.next} onClick={() => go(nav.next)}>
              <Icon name="r" />
            </IconButton>
            <Link
              href={`/journal#${t.tradeDate}`}
              className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium whitespace-nowrap text-on-primary no-underline transition-colors hover:bg-primary-hover"
            >
              <Icon name="book" />
              View analysis
            </Link>
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {[t.tradeDate, t.entryTime, sessionLabel(t.session), modelLabel(t.model)]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {(
          [
            ["Net P&L", usdSigned(t.net), toneText(t.net)],
            ["Captured R", rSigned(r), toneText(r)],
            ["Planned R:R", planned != null ? `1:${planned.toFixed(2)}` : "—", ""],
            ["Size", `${t.lots} lots`, ""],
          ] as const
        ).map(([label, value, tone]) => (
          <div key={label} className="rounded-lg border border-border bg-card p-4">
            <MicroLabel>{label}</MicroLabel>
            <div className={`mt-1 font-mono text-2xl leading-8 font-semibold tracking-tight ${tone}`}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 gap-4">
          {/* Screenshots */}
          <section className="min-w-0 rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base leading-6 font-semibold">Screenshots</h2>
            </div>
            {entryShots.length || tradeShots.length ? (
              <div className="grid gap-4">
                <ShotGrid shots={entryShots} label="Entry model" />
                <ShotGrid shots={tradeShots} label="Trade" />
              </div>
            ) : (
              <div>
                <span
                  className="block aspect-video w-full overflow-hidden rounded-md border border-border bg-background [&>svg]:h-full [&>svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: t.thumb }}
                  aria-hidden="true"
                />
                <div className="mt-3 font-mono text-xs text-subtle-foreground">
                  Generated preview · no screenshots attached
                </div>
              </div>
            )}
          </section>

          {/* Entry & exit */}
          <section className="min-w-0 rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base leading-6 font-semibold">Entry &amp; exit</h2>
              <Chip variant="neutral">{entryLabels(t.entries).slice(0, 2).join(" · ") || "—"}</Chip>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="grid grid-cols-[110px_1fr] items-center gap-x-4 gap-y-3">
                <span className="text-sm text-muted-foreground">Open price</span>
                <span className="text-right font-mono text-sm">{f(t.openPrice)}</span>
                <span className="text-sm text-muted-foreground">SL price</span>
                <span className="text-right font-mono text-sm text-loss">{f(t.slPrice)}</span>
                <span className="text-sm text-muted-foreground">Close price</span>
                <span className="text-right font-mono text-sm">{f(t.closePrice)}</span>
                <span className="text-sm text-muted-foreground">TP price</span>
                <span className="text-right font-mono text-sm text-profit">{f(t.tpPrice)}</span>
                <span className="text-sm text-muted-foreground">Lots</span>
                <span className="text-right font-mono text-sm">{t.lots}</span>
                <span className="text-sm text-muted-foreground">Moved</span>
                <span className="text-right font-mono text-sm">
                  {t.pips}{t.pipsPoints ? " pts" : " pips"}
                </span>
                <span className="text-sm text-muted-foreground">Inducement</span>
                <span className="text-right font-mono text-sm">{t.inducementTime || "—"}</span>
                <span className="text-sm text-muted-foreground">Entry</span>
                <span className="text-right font-mono text-sm">{t.entryTime || "—"}</span>
                <span className="text-sm text-muted-foreground">Exit</span>
                <span className="text-right font-mono text-sm">{t.exitTime || "—"}</span>
              </div>
              <div>
                <MicroLabel>Trade ladder</MicroLabel>
                <div className="relative mt-2 h-70">
                  <div className="absolute top-0 bottom-0 left-28 w-0.5 rounded-full bg-accent" />
                  {markers.map(({ label, price, kind }) => (
                    <div
                      key={label}
                      className="absolute right-0 left-0 flex translate-y-1/2 items-center gap-3"
                      style={{ bottom: `${12 + ((price - lo) / span) * 76}%` }}
                    >
                      <span className="w-22 text-right font-mono text-xs text-muted-foreground">
                        {label}
                      </span>
                      <span
                        className={`size-2.5 flex-none rounded-full ${
                          kind === "en"
                            ? "bg-chart-1"
                            : hit(kind)
                              ? kind === "sl"
                                ? "bg-loss"
                                : "bg-profit"
                              : "bg-chart-4"
                        }`}
                      />
                      <span className="font-mono text-xs">{f(price)}</span>
                      {kind === "en" ? null : (
                        <Chip variant={hit(kind) ? (kind === "sl" ? "loss" : "profit") : "outline"}>
                          {hit(kind) ? "HIT" : "—"}
                        </Chip>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Executions */}
          <section className="min-w-0 rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base leading-6 font-semibold">Executions</h2>
              <Chip>{t.executions.length} filled</Chip>
            </div>
            {t.executions.length ? (
              <div className="-mx-6 overflow-x-auto px-3">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {["Order ID", "Symbol", "Side", "Vol", "Open", "Close", "P&L", "Reason"].map((h, i) => (
                        <th
                          key={h}
                          className={`border-b border-border px-3 py-2 font-mono text-xs font-medium tracking-widest whitespace-nowrap text-muted-foreground uppercase ${i >= 3 ? "text-right" : "text-left"}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {t.executions.map((e) => (
                      <tr key={e.id}>
                        <td className="h-11 border-b border-border px-3 py-2 font-mono text-sm whitespace-nowrap">
                          <button
                            type="button"
                            title="Copy order ID"
                            onClick={() => copyOid(e.id)}
                            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                          >
                            #{e.id}
                            <Icon name="copy" className="size-3.5" />
                          </button>
                          {copied === e.id ? (
                            <span className="ml-1 font-mono text-xs text-profit">Copied</span>
                          ) : null}
                        </td>
                        <td className="h-11 border-b border-border px-3 py-2 font-mono text-sm">{e.symbol}</td>
                        <td className="h-11 border-b border-border px-3 py-2 font-mono text-sm">{e.side}</td>
                        <td className="h-11 border-b border-border px-3 py-2 text-right font-mono text-sm whitespace-nowrap">{e.volume}</td>
                        <td className="h-11 border-b border-border px-3 py-2 text-right font-mono text-sm">{e.openPrice}</td>
                        <td className="h-11 border-b border-border px-3 py-2 text-right font-mono text-sm">{e.closePrice}</td>
                        <td className={`h-11 border-b border-border px-3 py-2 text-right font-mono text-sm whitespace-nowrap ${toneText(e.profit)}`}>
                          {usdSigned(e.profit)}
                        </td>
                        <td className="h-11 border-b border-border px-3 py-2">
                          <Chip variant={e.reason === "TP" ? "profit" : e.reason === "SL" ? "loss" : "outline"}>
                            {e.reason || "—"}
                          </Chip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No executions stored. Order IDs: {t.orderIds.join(", ") || "—"}
              </p>
            )}
          </section>

          {/* Notes */}
          <section className="min-w-0 rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base leading-6 font-semibold">Notes</h2>
            </div>
            {t.mechanicsContext ? (
              <div className="mb-4">
                <MicroLabel>Market mechanics</MicroLabel>
                <p className="mt-1 text-sm">{t.mechanicsContext}</p>
              </div>
            ) : null}
            {t.notes ? <p className="text-sm whitespace-pre-line">{t.notes}</p> : null}
            {t.psychNote ? (
              <p className="mt-3 text-sm whitespace-pre-line text-muted-foreground">{t.psychNote}</p>
            ) : null}
            {!t.notes && !t.psychNote && !t.mechanicsContext ? (
              <p className="text-sm text-muted-foreground">No notes.</p>
            ) : null}
            {t.psychTags.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {psychLabels(t.psychTags).map((p) => (
                  <Chip key={p} variant="warning">{p}</Chip>
                ))}
              </div>
            ) : null}
          </section>
        </div>

        {/* Details */}
        <section className="min-w-0 rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base leading-6 font-semibold">Details</h2>
          </div>
          {detailRows.map(([label, value], i) => (
            <div
              key={label}
              className={`grid gap-2 border-b border-border py-4 ${i === 0 ? "pt-0" : ""} ${i === detailRows.length - 1 ? "border-b-0 pb-0" : ""}`}
            >
              <MicroLabel>{label}</MicroLabel>
              <div>{value}</div>
            </div>
          ))}
          <div className="grid gap-2 border-b border-border py-4">
            <MicroLabel>Entry models</MicroLabel>
            <div className="flex flex-wrap gap-1.5">
              {entryLabels(t.entries).map((e) => (
                <Chip key={e}>{e}</Chip>
              ))}
              {!t.entries.length ? <span className="text-sm text-muted-foreground">—</span> : null}
            </div>
          </div>
          <div className="grid gap-2 py-4 last:pb-0">
            <MicroLabel>POI types</MicroLabel>
            <div className="flex flex-wrap gap-1.5">
              {poiLabels(t.pois).map((p) => (
                <Chip key={p} variant="neutral">{p}</Chip>
              ))}
              {!t.pois.length ? <span className="text-sm text-muted-foreground">—</span> : null}
            </div>
          </div>
          <div className="grid gap-2 py-4 last:pb-0">
            <MicroLabel>Daily journal</MicroLabel>
            <Link
              href={`/journal#${t.tradeDate}`}
              className="flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:bg-surface-high"
            >
              <Icon name="folder" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">
                  {t.tradeDate ? monthDayYear(t.tradeDate) : "—"}
                </span>
                <span className="block font-mono text-xs text-subtle-foreground">
                  {t.orderIds.length} order{t.orderIds.length === 1 ? "" : "s"}
                </span>
              </span>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
