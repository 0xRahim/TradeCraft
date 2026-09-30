"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Chip, IconButton, MicroLabel } from "@/components/dashboard/ui";
import { Icon } from "@/components/dashboard/icons";
import {
  monthDayYear,
  rSigned,
  usdSigned,
} from "@/lib/dashboard/format";
import {
  addMinutes,
  CONDITIONS,
  DETAIL_TRADES,
  MARKETS,
  RESULT_LABELS,
  tradeChart,
  tradeLevels,
  tradePnl,
  tradeR,
  TRADE_OVERRIDES_KEY,
  type DetailTrade,
  type TradeDir,
  type TradeOverrides,
  type TradeResult,
} from "./detail-data";

const SHOT_TABS = ["Setup · 4H", "Entry · 5m", "Result · 5m"] as const;
const GRADES: Record<string, [number, string]> = {
  "2026-09-28": [8, "eurusd-ny-am"],
  "2026-09-24": [4, "nq-thesis"],
  "2026-09-23": [6, "range-day-notes"],
};

function toneText(n: number): string {
  return n > 0 ? "text-profit" : n < 0 ? "text-loss" : "";
}

function ChartFigure({
  svg,
  label,
  onZoom,
  tall,
}: {
  svg: string;
  label: string;
  onZoom?: () => void;
  tall?: boolean;
}) {
  const inner = (
    <>
      <span
        className="absolute inset-0 [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
        aria-hidden="true"
      />
    </>
  );
  const cls =
    "relative block aspect-video w-full overflow-hidden rounded-md border border-border bg-background";
  return onZoom ? (
    <button type="button" onClick={onZoom} aria-label={`Enlarge ${label}`} className={`${cls} cursor-zoom-in`}>
      {inner}
    </button>
  ) : (
    <div className={tall ? `${cls} aspect-auto` : cls}>{inner}</div>
  );
}

export function TradeDetailView({ tradeId }: { tradeId: string }) {
  const router = useRouter();
  const ix = DETAIL_TRADES.findIndex((t) => t.id === tradeId);
  const base = DETAIL_TRADES[ix];
  const [tab, setTab] = useState<0 | 1 | 2>(1);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [overrides, setOverrides] = useState<TradeOverrides>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(TRADE_OVERRIDES_KEY);
      if (raw) {
        const all = JSON.parse(raw) as Record<string, TradeOverrides>;
        return all[tradeId] ?? {};
      }
    } catch {
      /* ignore */
    }
    return {};
  });
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!base) return null;
  const t: DetailTrade = { ...base, ...overrides };
  const L = tradeLevels(t);
  const r = tradeR(t);
  const pnl = tradePnl(t);
  const resTone = t.res === "win" ? "profit" : t.res === "loss" ? "loss" : "neutral";
  const grade = GRADES[t.date];

  function update<K extends keyof TradeOverrides>(k: K, v: TradeOverrides[K]) {
    setOverrides((o) => {
      const next = { ...o, [k]: v };
      try {
        const raw = window.localStorage.getItem(TRADE_OVERRIDES_KEY);
        const all = raw ? (JSON.parse(raw) as Record<string, TradeOverrides>) : {};
        all[tradeId] = { ...all[tradeId], ...next };
        window.localStorage.setItem(TRADE_OVERRIDES_KEY, JSON.stringify(all));
      } catch {
        /* ignore */
      }
      return next;
    });
    setSaving(true);
    setTimeout(() => setSaving(false), 600);
  }

  function copyOid(oid: number) {
    try {
      void navigator.clipboard.writeText(String(oid));
    } catch {
      /* ignore */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  const go = (d: 1 | -1) => {
    const n = DETAIL_TRADES[ix + d];
    if (n) router.push(`/trades/${n.id}`);
  };

  /* executions */
  const buySide = t.dir === "bull" ? "Buy" : "Sell";
  const exitSide = t.dir === "bull" ? "Sell" : "Buy";
  const half = +((t.size / 2).toFixed(2));
  const execs: [number, string, string, string, number, string, "Filled" | "Cancelled"][] = [
    [t.oid, t.time, "Entry", buySide, t.size, L.en, "Filled"],
    [t.oid + 1, t.res === "win" ? addMinutes(t.time, 14) : "—", "TP1", exitSide, half, L.tp1, t.res === "win" ? "Filled" : "Cancelled"],
    [t.oid + 2, t.res === "win" ? addMinutes(t.time, 31) : "—", "TP2", exitSide, half, L.tp2, t.res === "win" ? "Filled" : "Cancelled"],
    [
      t.oid + 3,
      t.res === "win" ? "—" : addMinutes(t.time, t.res === "loss" ? 22 : 47),
      t.res === "be" ? "Stop (breakeven)" : "Stop loss",
      exitSide,
      t.size,
      t.res === "be" ? L.en : L.sl,
      t.res === "win" ? "Cancelled" : "Filled",
    ],
  ];

  /* ladder */
  const markers: [string, number, string, "tp2" | "tp1" | "en" | "sl"][] = [
    ["TP2", t.tp2, L.tp2, "tp2"],
    ["TP1", t.tp1, L.tp1, "tp1"],
    ["Entry", 0, L.en, "en"],
    ["SL", -t.sl, L.sl, "sl"],
  ];
  const hit = (k: string) =>
    t.res === "win" ? k !== "sl" : t.res === "loss" ? k === "sl" : k === "tp1" ? false : false;

  return (
    <>
      <Topbar
        crumb={
          <>
            Trade log / <b className="font-medium text-foreground">{t.tk}</b>
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
          <h1 className="text-2xl leading-8 font-medium tracking-tight">{t.tk}</h1>
          <Chip icon={t.dir === "bull" ? "up" : "down"}>
            {t.dir === "bull" ? "BULLISH" : "BEARISH"}
          </Chip>
          <Chip variant={resTone}>{RESULT_LABELS[t.res].toUpperCase()}</Chip>
          <div className="ml-auto flex items-center gap-2">
            <IconButton label="Previous trade" disabled={ix === 0} onClick={() => go(-1)}>
              <Icon name="l" />
            </IconButton>
            <span className="font-mono text-xs text-subtle-foreground">
              {ix + 1} / {DETAIL_TRADES.length}
            </span>
            <IconButton
              label="Next trade"
              disabled={ix === DETAIL_TRADES.length - 1}
              onClick={() => go(1)}
            >
              <Icon name="r" />
            </IconButton>
            <Link
              href={`/journal#${t.date}`}
              className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium whitespace-nowrap text-on-primary no-underline transition-colors hover:bg-primary-hover"
            >
              <Icon name="book" />
              View analysis
            </Link>
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {monthDayYear(t.date)} · {t.time} · {t.sess} · {t.md}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {(
          [
            ["Net P&L", usdSigned(pnl), toneText(pnl)],
            ["Result R", rSigned(r), toneText(r)],
            ["Planned R:R", `1:${(t.tp2 / t.sl).toFixed(0)}`, ""],
            ["Risk", `$${t.risk}`, ""],
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
          {/* Screenshot */}
          <section className="min-w-0 rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base leading-6 font-semibold">Screenshot</h2>
              <div role="group" aria-label="Screenshot" className="flex h-8 overflow-hidden rounded-lg border border-border">
                {SHOT_TABS.map((n, i) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTab(i as 0 | 1 | 2)}
                    className={`flex flex-1 items-center justify-center gap-1.5 px-3 text-sm font-medium whitespace-nowrap transition-colors ${i > 0 ? "border-l border-border" : ""} ${i === tab ? "bg-card text-foreground" : "bg-surface-high text-muted-foreground hover:text-foreground"}`}
                  >
                    {n.split(" · ")[0]}
                  </button>
                ))}
              </div>
            </div>
            <ChartFigure svg={tradeChart(t, tab)} label={SHOT_TABS[tab]} onZoom={() => setLightbox(tab)} />
            <div className="mt-3 font-mono text-xs text-subtle-foreground">
              {SHOT_TABS[tab]} · click to enlarge
            </div>
          </section>

          {/* Entry & exit */}
          <section className="min-w-0 rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base leading-6 font-semibold">Entry &amp; exit</h2>
              <Chip variant="neutral">{t.em}</Chip>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <ChartFigure svg={tradeChart(t, 1)} label="Entry screenshot" onZoom={() => setLightbox(1)} />
                <div className="mt-4 grid grid-cols-[110px_1fr] items-center gap-x-4 gap-y-3">
                  <span className="text-sm text-muted-foreground">Entry model</span>
                  <span className="text-right font-mono text-sm">{t.em}</span>
                  <span className="text-sm text-muted-foreground">Entry price</span>
                  <span className="text-right font-mono text-sm">{L.en}</span>
                  <span className="text-sm text-muted-foreground">SL {t.unit}</span>
                  <span className="text-right font-mono text-sm text-loss">
                    {t.sl} · {L.sl}
                  </span>
                  <span className="text-sm text-muted-foreground">First TP {t.unit}</span>
                  <span className="text-right font-mono text-sm text-profit">
                    {t.tp1} · {L.tp1}
                  </span>
                  <span className="text-sm text-muted-foreground">Second TP {t.unit}</span>
                  <span className="text-right font-mono text-sm text-profit">
                    {t.tp2} · {L.tp2}
                  </span>
                </div>
              </div>
              <div>
                <MicroLabel>Trade ladder</MicroLabel>
                <div className="relative mt-2 h-70">
                  <div className="absolute top-0 bottom-0 left-28 w-0.5 rounded-full bg-accent" />
                  {markers.map(([label, v, price, k]) => (
                    <div
                      key={label}
                      className="absolute right-0 left-0 flex translate-y-1/2 items-center gap-3"
                      style={{ bottom: `${12 + ((v + t.sl) / (t.sl + t.tp2)) * 76}%` }}
                    >
                      <span className="w-22 text-right font-mono text-xs text-muted-foreground">
                        {label} {v > 0 ? `+${v}` : v || ""}
                      </span>
                      <span
                        className={`size-2.5 flex-none rounded-full ${
                          k === "en"
                            ? "bg-chart-1"
                            : k === "sl"
                              ? hit(k)
                                ? "bg-loss"
                                : "bg-chart-4"
                              : hit(k)
                                ? "bg-profit"
                                : "bg-chart-4"
                        }`}
                      />
                      <span className="font-mono text-xs">{price}</span>
                      {k === "en" ? null : (
                        <Chip variant={hit(k) ? (k === "sl" ? "loss" : "profit") : "outline"}>
                          {hit(k) ? "HIT" : t.res === "be" && k === "sl" ? "BE STOP" : "—"}
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
              <Chip>{execs.filter((e) => e[6] === "Filled").length} filled</Chip>
            </div>
            <div className="-mx-6 overflow-x-auto px-3">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["Order ID", "Time", "Type", "Side", "Size", "Price", "Status"].map((h, i) => (
                      <th
                        key={h}
                        className={`border-b border-border px-3 py-2 font-mono text-xs font-medium tracking-widest whitespace-nowrap text-muted-foreground uppercase ${i >= 4 ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {execs.map((e) => (
                    <tr key={e[0]}>
                      <td className="h-11 border-b border-border px-3 py-2 font-mono text-sm whitespace-nowrap">
                        <button
                          type="button"
                          title="Copy order ID"
                          onClick={() => copyOid(e[0])}
                          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                        >
                          #{e[0]}
                          <Icon name="copy" className="size-3.5" />
                        </button>
                      </td>
                      <td className="h-11 border-b border-border px-3 py-2 font-mono text-sm whitespace-nowrap">{copied && e[0] === t.oid ? "Copied" : e[1]}</td>
                      <td className="h-11 border-b border-border px-3 py-2 font-sans text-sm">{e[2]}</td>
                      <td className="h-11 border-b border-border px-3 py-2 font-mono text-sm">{e[3]}</td>
                      <td className="h-11 border-b border-border px-3 py-2 text-right font-mono text-sm whitespace-nowrap">
                        {e[4]} <span className="text-subtle-foreground">{t.su}</span>
                      </td>
                      <td className="h-11 border-b border-border px-3 py-2 text-right font-mono text-sm">{e[5]}</td>
                      <td className="h-11 border-b border-border px-3 py-2">
                        <Chip variant={e[6] === "Filled" ? "neutral" : "outline"}>
                          {e[6].toUpperCase()}
                        </Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Notes */}
          <section className="min-w-0 rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base leading-6 font-semibold">Notes</h2>
              <span className="text-xs text-subtle-foreground">
                {saving ? "Saving…" : "Saved"}
              </span>
            </div>
            <textarea
              value={t.note}
              onChange={(e) => update("note", e.target.value)}
              rows={6}
              placeholder="What happened, what you learned..."
              aria-label="Trade notes"
              className="min-h-40 w-full resize-y rounded-lg border border-input bg-card p-3 font-sans text-sm text-foreground outline-none placeholder:text-subtle-foreground focus:border-ring"
            />
          </section>
        </div>

        {/* Details */}
        <section className="min-w-0 rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base leading-6 font-semibold">Details</h2>
          </div>
          <div className="grid gap-2 border-b border-border py-4 first:pt-0">
            <MicroLabel>Trade model</MicroLabel>
            <span className="font-medium">{t.md}</span>
          </div>
          <div className="grid gap-2 border-b border-border py-4">
            <MicroLabel>Result</MicroLabel>
            <div className="flex h-8 overflow-hidden rounded-lg border border-border">
              {(["win", "loss", "be"] as TradeResult[]).map((v, i) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => update("res", v)}
                  className={`flex flex-1 items-center justify-center px-3 text-sm font-medium transition-colors ${i > 0 ? "border-l border-border" : ""} ${
                    t.res === v
                      ? v === "win"
                        ? "bg-profit-container text-on-profit-container"
                        : v === "loss"
                          ? "bg-loss-container text-on-loss-container"
                          : "bg-accent text-foreground"
                      : "bg-surface-high text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {RESULT_LABELS[v]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2 border-b border-border py-4">
            <MicroLabel>Direction</MicroLabel>
            <div className="flex h-8 overflow-hidden rounded-lg border border-border">
              {(["bull", "bear"] as TradeDir[]).map((v, i) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => update("dir", v)}
                  className={`flex flex-1 items-center justify-center gap-1.5 px-3 text-sm font-medium transition-colors ${i > 0 ? "border-l border-border" : ""} ${t.dir === v ? "bg-card text-foreground" : "bg-surface-high text-muted-foreground hover:text-foreground"}`}
                >
                  <Icon name={v === "bull" ? "up" : "down"} className="size-3.5" />
                  {v === "bull" ? "Bullish" : "Bearish"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2 border-b border-border py-4">
            <MicroLabel>Condition</MicroLabel>
            <div className="grid gap-1">
              {(Object.keys(CONDITIONS) as (keyof typeof CONDITIONS)[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => update("cond", v)}
                  className={`flex w-full items-center gap-3 rounded-lg border border-border p-2 px-3 text-left transition-colors ${t.cond === v ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
                >
                  <span className="grid size-4 flex-none place-items-center rounded-full border border-input">
                    {t.cond === v ? <span className="size-2 rounded-full bg-primary" /> : null}
                  </span>
                  {CONDITIONS[v]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2 border-b border-border py-4">
            <MicroLabel>Market condition</MicroLabel>
            <div className="flex h-8 overflow-hidden rounded-lg border border-border">
              {(Object.keys(MARKETS) as (keyof typeof MARKETS)[]).map((v, i) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => update("mkt", v)}
                  className={`flex flex-1 items-center justify-center px-3 text-sm font-medium transition-colors ${i > 0 ? "border-l border-border" : ""} ${t.mkt === v ? "bg-card text-foreground" : "bg-surface-high text-muted-foreground hover:text-foreground"}`}
                >
                  {MARKETS[v]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2 border-b border-border py-4">
            <MicroLabel>Risk to reward</MicroLabel>
            <span className="font-mono text-sm">
              Planned 1:{(t.tp2 / t.sl).toFixed(0)} · Realized{" "}
              <span className={toneText(r)}>{rSigned(r)}</span>
            </span>
          </div>
          <div className="grid gap-2 border-b border-border py-4">
            <MicroLabel>Note</MicroLabel>
            <textarea
              value={t.sum}
              onChange={(e) => update("sum", e.target.value)}
              rows={2}
              aria-label="Trade summary"
              className="min-h-18 w-full resize-y rounded-lg border border-input bg-card p-3 font-sans text-sm text-foreground outline-none focus:border-ring"
            />
          </div>
          <div className="grid gap-2 py-4 last:pb-0">
            <MicroLabel>Daily journal</MicroLabel>
            <Link
              href={`/journal#${t.date}`}
              className="flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:bg-surface-high"
            >
              <Icon name="folder" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">
                  {monthDayYear(t.date)}
                </span>
                <span className="block font-mono text-xs text-subtle-foreground">
                  {grade ? `${grade[1]}.md` : "No analysis yet"}
                </span>
              </span>
              {grade ? (
                <Chip variant={grade[0] >= 7 ? "profit" : grade[0] >= 5 ? "warning" : "loss"}>
                  {grade[0]}/10
                </Chip>
              ) : null}
            </Link>
          </div>
        </section>
      </div>

      {lightbox != null ? (
        <div
          className="fixed inset-0 z-60 grid place-items-center bg-overlay p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged screenshot"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightbox(null);
          }}
        >
          <div className="w-full max-w-275 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="font-sans text-sm font-medium">
                {t.tk} · {SHOT_TABS[lightbox].replace("·", "").trim()}
              </span>
              <IconButton label="Close" onClick={() => setLightbox(null)}>
                <Icon name="x" />
              </IconButton>
            </div>
            <span
              className="block [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: tradeChart(t, lightbox as 0 | 1 | 2) }}
              aria-hidden="true"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
