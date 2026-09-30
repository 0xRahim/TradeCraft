"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import {
  Chip,
  IconButton,
  MicroLabel,
  Segmented,
} from "@/components/dashboard/ui";
import { Icon } from "@/components/dashboard/icons";
import {
  monthDay,
  monthLongYear,
  pad2,
  rSigned,
  usdSigned,
} from "@/lib/dashboard/format";
import {
  MODELS,
  PAIRS,
  SESSIONS,
} from "@/lib/dashboard/trade-options";
import {
  entryLabels,
  modelLabel,
  outcomeTone,
  poiLabels,
  psychLabels,
  recordR,
  sessionLabel,
  type TradeRecord,
} from "@/lib/dashboard/trade-record";
import { useTradeLog } from "@/lib/dashboard/remote";
import {
  FullViewLink,
  ModelCell,
  OutcomeChip,
  PairCell,
  RCELL,
  SessionCell,
  SourceChip,
  TradeDate,
  TradeThumb,
  ValidityChip,
} from "./trade-bits";

type View = "list" | "gallery" | "calendar";
type SortKey = "date" | "pair" | "model" | "r" | "net";

function toneText(n: number): string {
  return n > 0 ? "text-profit" : n < 0 ? "text-loss" : "";
}

function Summary({ rows }: { rows: TradeRecord[] }) {
  const tps = rows.filter((t) => t.outcome === "TP").length;
  const sls = rows.filter((t) => t.outcome === "SL").length;
  const net = rows.reduce((x, t) => x + t.net, 0);
  const avgR = rows.length
    ? rows.reduce((x, t) => x + recordR(t), 0) / rows.length
    : 0;
  const decided = tps + sls;
  const tiles: [string, string, string][] = [
    ["Trades", String(rows.length), ""],
    ["Net P&L", usdSigned(net), toneText(net)],
    [
      "Win rate",
      decided ? ((tps / decided) * 100).toFixed(1) + "%" : "—",
      "",
    ],
    ["Avg R", rSigned(avgR), toneText(avgR)],
  ];
  return (
    <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map(([label, value, tone]) => (
        <div
          key={label}
          className="rounded-lg border border-border bg-card p-4"
        >
          <MicroLabel>{label}</MicroLabel>
          <div className={`mt-1 font-mono text-2xl leading-8 font-semibold tracking-tight ${tone}`}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

function TradeModal({
  trade,
  position,
  onClose,
  onStep,
}: {
  trade: TradeRecord;
  position: { index: number; total: number };
  onClose: () => void;
  onStep: (d: 1 | -1) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
  }, [trade.id]);
  const r = recordR(trade);
  const stats: [string, React.ReactNode, boolean?][] = [
    ["Model", modelLabel(trade.model) || "—", true],
    ["Session", sessionLabel(trade.session) || "—", true],
    ["Date", `${trade.tradeDate ? monthDay(trade.tradeDate) : "—"} · ${trade.entryTime}`, false],
    [
      "Captured R",
      <span key="r" className={toneText(r)}>
        {rSigned(r)}
      </span>,
      false,
    ],
    [
      "Net P&L",
      <span key="p" className={toneText(trade.net)}>
        {usdSigned(trade.net)}
      </span>,
      false,
    ],
    ["Size", `${trade.lots} lots · ${trade.pips}${trade.pipsPoints ? " pts" : " pips"}`, false],
  ];
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-overlay p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${trade.pair} trade`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full max-w-180 overflow-auto rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border p-4 pl-6">
          <span className="flex flex-1 flex-wrap items-center gap-2 font-sans text-sm font-medium">
            {trade.pair}
            <Chip>{trade.side === "long" ? "LONG" : "SHORT"}</Chip>
            <OutcomeChip outcome={trade.outcome} />
            <ValidityChip validity={trade.validity} />
            <SourceChip source={trade.source} />
          </span>
          <FullViewLink id={trade.id} />
          <IconButton label="Close" onClick={onClose}>
            <span ref={closeRef} className="grid place-items-center">
              <Icon name="x" />
            </span>
          </IconButton>
        </div>
        <div className="relative aspect-video border-b border-border bg-background">
          <span
            className="absolute inset-0 [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: trade.thumb }}
            aria-hidden="true"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 p-6 md:grid-cols-3">
          {stats.map(([label, value, sans]) => (
            <div key={label}>
              <MicroLabel>{label}</MicroLabel>
              <div
                className={`mt-0.5 font-mono text-sm leading-6 ${sans ? "font-sans" : ""}`}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 px-6 pb-4">
          {entryLabels(trade.entries).map((e) => (
            <Chip key={e}>{e}</Chip>
          ))}
          {poiLabels(trade.pois).map((p) => (
            <Chip key={p} variant="neutral">{p}</Chip>
          ))}
          {psychLabels(trade.psychTags).map((p) => (
            <Chip key={p} variant="warning">{p}</Chip>
          ))}
        </div>
        {trade.mechanicsContext ? (
          <div className="px-6 pb-4 text-sm text-muted-foreground">{trade.mechanicsContext}</div>
        ) : null}
        <div className="px-6 pb-6 text-muted-foreground">{trade.notes || trade.psychNote}</div>
        <div className="flex gap-2 border-t border-border bg-surface-high p-4 px-6">
          <button
            type="button"
            disabled={position.index <= 0}
            onClick={() => onStep(-1)}
            className="h-9 flex-1 rounded-lg border border-border text-sm font-medium transition-colors not-disabled:hover:bg-accent disabled:cursor-default disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-ring"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={position.index >= position.total - 1}
            onClick={() => onStep(1)}
            className="h-9 flex-1 rounded-lg border border-border text-sm font-medium transition-colors not-disabled:hover:bg-accent disabled:cursor-default disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-ring"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export function TradesView() {
  // Remote-first log (falls back to the local list offline/anon).
  const all = useTradeLog();
  const [view, setView] = useState<View>("list");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [model, setModel] = useState("all");
  const [pair, setPair] = useState("all");
  const [session, setSession] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [dir, setDir] = useState<-1 | 1>(-1);
  const [[cy, cm], setCm] = useState<[number, number]>(() => {
    const now = new Date();
    return [now.getFullYear(), now.getMonth()];
  });
  const [selDay, setSelDay] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    const a = all.filter(
      (t) =>
        (status === "all" || t.outcome === status) &&
        (model === "all" || t.model === model) &&
        (pair === "all" || t.pair === pair) &&
        (session === "all" || t.session === session) &&
        (!query || (t.pair + " " + modelLabel(t.model)).toLowerCase().includes(query)),
    );
    a.sort((x, y) =>
      dir *
      (sortKey === "date"
        ? (x.tradeDate + x.entryTime).localeCompare(y.tradeDate + y.entryTime)
        : sortKey === "pair"
          ? x.pair.localeCompare(y.pair)
          : sortKey === "model"
            ? modelLabel(x.model).localeCompare(modelLabel(y.model))
            : sortKey === "r"
              ? recordR(x) - recordR(y)
              : x.net - y.net),
    );
    return a;
  }, [all, q, status, model, pair, session, sortKey, dir]);

  /* calendar month */
  const cal = useMemo(() => {
    const by: Record<string, TradeRecord[]> = {};
    rows.forEach((t) => {
      if (!t.tradeDate) return;
      (by[t.tradeDate] = by[t.tradeDate] || []).push(t);
    });
    const f = new Date(cy, cm, 1).getDay();
    const dm = new Date(cy, cm + 1, 0).getDate();
    const key = (d: number) => `${cy}-${pad2(cm + 1)}-${pad2(d)}`;
    const prefix = key(1).slice(0, 7);
    let sel = selDay;
    if (!sel || !sel.startsWith(prefix)) {
      sel = Object.keys(by)
        .filter((k) => k.startsWith(prefix))
        .sort()
        .pop() || null;
    }
    const cells: { day: number | null; date: string | null }[] = [];
    for (let i = 0; i < Math.ceil((f + dm) / 7) * 7; i++) {
      const d = i - f + 1;
      cells.push(d < 1 || d > dm ? { day: null, date: null } : { day: d, date: key(d) });
    }
    const monthPnl = Object.keys(by)
      .filter((k) => k.startsWith(prefix))
      .reduce((x, k) => x + by[k].reduce((z, t) => z + t.net, 0), 0);
    return { by, cells, sel, monthPnl };
  }, [rows, cy, cm, selDay]);

  const openTrade = openId != null ? all.find((t) => t.id === openId) : undefined;
  const openIndex = openTrade ? rows.findIndex((t) => t.id === openTrade.id) : -1;

  useEffect(() => {
    if (openId == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
      if (e.key === "ArrowRight" && openIndex < rows.length - 1)
        setOpenId(rows[openIndex + 1].id);
      if (e.key === "ArrowLeft" && openIndex > 0)
        setOpenId(rows[openIndex - 1].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const sortBy = (k: SortKey) => {
    if (k === sortKey) setDir((d) => (d === -1 ? 1 : -1));
    else {
      setSortKey(k);
      setDir(-1);
    }
  };

  const headers: { key: SortKey | null; label: string; right?: boolean }[] = [
    { key: null, label: "Preview" },
    { key: "pair", label: "Pair" },
    { key: "model", label: "Model" },
    { key: null, label: "Date" },
    { key: null, label: "Session" },
    { key: null, label: "Status" },
    { key: "r", label: "R", right: true },
    { key: "net", label: "Net P&L", right: true },
    { key: null, label: "Validity" },
  ];

  return (
    <>
      <Topbar
        crumb={
          <>
            Overview / <b className="font-medium text-foreground">Trade log</b>
          </>
        }
      />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl leading-8 font-medium tracking-tight">
            Trade log
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Every trade with its session, status and model.
          </p>
        </div>
        <Segmented<View>
          label="View"
          value={view}
          onChange={setView}
          options={[
            { value: "list", label: (<><Icon name="list" />List</>) },
            { value: "gallery", label: (<><Icon name="grid2" />Gallery</>) },
            { value: "calendar", label: (<><Icon name="cal" />Calendar</>) },
          ]}
        />
      </div>

      <Summary rows={rows} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-50 max-w-90 flex-1">
          <span className="absolute top-2.5 left-2.5 text-subtle-foreground">
            <Icon name="search" />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search pair, model..."
            aria-label="Search trades"
            className="h-9 w-full rounded-lg border border-input bg-card pr-3 pl-8 font-sans text-sm text-foreground outline-none placeholder:text-subtle-foreground focus:border-ring"
          />
        </div>
        {(
          [
            [status, setStatus, "Status", ["all", "TP", "SL", "BE"], ["All statuses", "TP", "SL", "BE"]],
            [model, setModel, "Model", ["all", ...MODELS.map((m) => m.value)], ["All models", ...MODELS.map((m) => m.label)]],
            [pair, setPair, "Pair", ["all", ...PAIRS], ["All pairs", ...PAIRS]],
            [session, setSession, "Session", ["all", ...SESSIONS.map((s) => s.value)], ["All sessions", ...SESSIONS.map((s) => s.label)]],
          ] as const
        ).map(([v, set, label, values, labels]) => (
          <select
            key={label}
            aria-label={label}
            value={v}
            onChange={(e) => set(e.target.value)}
            className="h-9 cursor-pointer rounded-lg border border-input bg-card px-3 font-sans text-sm text-foreground outline-none focus:border-ring"
          >
            {values.map((val, i) => (
              <option key={val} value={val}>
                {labels[i]}
              </option>
            ))}
          </select>
        ))}
        <span className="ml-auto text-xs text-subtle-foreground">
          {rows.length} of {all.length} trades
        </span>
      </div>

      {!rows.length ? (
        <div className="rounded-lg border border-border bg-card px-4 py-16 text-center text-muted-foreground">
          {all.length === 0 ? (
            <>
              No trades yet. Log your first trade to start the log.
              <div className="mt-4">
                <Link
                  href="/trades/new"
                  className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary no-underline transition-colors hover:bg-primary-hover"
                >
                  New trade
                </Link>
              </div>
            </>
          ) : (
            "No trades match these filters."
          )}
        </div>
      ) : view === "list" ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className={`bg-card px-4 py-3 font-mono text-xs font-medium tracking-widest whitespace-nowrap text-muted-foreground uppercase ${h.right ? "text-right" : "text-left"} border-b border-border`}
                  >
                    {h.key ? (
                      <button
                        type="button"
                        onClick={() => sortBy(h.key as SortKey)}
                        className="inline-flex gap-1 font-mono tracking-widest uppercase hover:text-foreground"
                      >
                        {h.label}
                        {sortKey === h.key ? (dir < 0 ? " ↓" : " ↑") : ""}
                      </button>
                    ) : (
                      h.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr
                  key={t.id}
                  tabIndex={0}
                  onClick={() => setOpenId(t.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setOpenId(t.id);
                  }}
                  className="h-15 cursor-pointer transition-colors hover:bg-surface-high focus-visible:bg-surface-high focus-visible:outline-none"
                >
                  <td className="border-b border-border px-4 py-2 font-mono text-sm">
                    <TradeThumb trade={t} />
                  </td>
                  <td className="border-b border-border px-4 py-2">
                    <PairCell trade={t} />
                  </td>
                  <td className="border-b border-border px-4 py-2">
                    <ModelCell trade={t} />
                  </td>
                  <td className="border-b border-border px-4 py-2 font-mono text-sm whitespace-nowrap">
                    <TradeDate trade={t} />
                  </td>
                  <td className="border-b border-border px-4 py-2">
                    <SessionCell trade={t} />
                  </td>
                  <td className="border-b border-border px-4 py-2">
                    <OutcomeChip outcome={t.outcome} />
                  </td>
                  <td className="border-b border-border px-4 py-2 text-right font-mono text-sm whitespace-nowrap">
                    <RCELL trade={t} />
                  </td>
                  <td className={`border-b border-border px-4 py-2 text-right font-mono text-sm whitespace-nowrap ${toneText(t.net)}`}>
                    {usdSigned(t.net)}
                  </td>
                  <td className="border-b border-border px-4 py-2">
                    <span className="flex items-center gap-1.5">
                      <ValidityChip validity={t.validity} />
                      <SourceChip source={t.source} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : view === "gallery" ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {rows.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setOpenId(t.id)}
              className="overflow-hidden rounded-lg border border-border bg-card text-left transition-colors hover:border-ring focus-visible:outline-2 focus-visible:outline-ring"
            >
              <div className="relative aspect-video border-b border-border bg-background">
                <span
                  className="absolute inset-0 [&>svg]:h-full [&>svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: t.thumb }}
                  aria-hidden="true"
                />
                <span className="absolute top-3 left-3">
                  <Chip>{t.side === "long" ? "LONG" : "SHORT"}</Chip>
                </span>
                <span className="absolute top-3 right-3">
                  <Chip variant={outcomeTone(t.outcome)}>
                    {t.outcome}
                  </Chip>
                </span>
              </div>
              <div className="grid gap-2 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-sans text-sm font-medium">{t.pair}</span>
                  <b className={`font-mono text-base ${toneText(t.net)}`}>
                    {usdSigned(t.net)}
                  </b>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">{modelLabel(t.model)}</span>
                  <span className="font-mono text-xs text-subtle-foreground">
                    {sessionLabel(t.session)}
                  </span>
                </div>
                <span className="font-mono text-xs text-subtle-foreground">
                  {t.tradeDate ? monthDay(t.tradeDate) : "—"} · {t.entryTime}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="mr-auto text-base leading-6 font-semibold">
                {monthLongYear(cy, cm)}
              </h2>
              <span className={`font-mono ${toneText(cal.monthPnl)}`}>
                {usdSigned(cal.monthPnl)}
              </span>
              <IconButton
                label="Previous month"
                onClick={() => setCm(([yy, mm]) => (mm ? [yy, mm - 1] : [yy - 1, 11]))}
              >
                <Icon name="l" />
              </IconButton>
              <IconButton
                label="Next month"
                disabled={cy === 2026 && cm >= 8}
                onClick={() => setCm(([yy, mm]) => (mm < 11 ? [yy, mm + 1] : [yy + 1, 0]))}
              >
                <Icon name="r" />
              </IconButton>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {"SMTWTFS".split("").map((d, i) => (
                <div
                  key={i}
                  className="pb-1 text-center font-mono text-xs font-medium tracking-widest text-subtle-foreground uppercase"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-2">
              {cal.cells.map((c, i) => {
                if (!c.day || !c.date) return <div key={i} />;
                const list = cal.by[c.date] || [];
                const p = list.reduce((x, t) => x + t.net, 0);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelDay(c.date)}
                    style={{ "--k": Math.min(Math.abs(p) / 600, 1).toFixed(2) } as React.CSSProperties}
                    className={[
                      "flex min-h-18 min-w-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-md border border-transparent font-mono text-xs leading-4",
                      list.length
                        ? p >= 0
                          ? "cal-day-win"
                          : "cal-day-loss"
                        : "text-subtle-foreground",
                      c.date === cal.sel
                        ? "outline-1 outline-primary outline-offset-2"
                        : "",
                    ].join(" ")}
                  >
                    <b className="text-sm leading-4 font-medium">{c.day}</b>
                    {list.length ? (
                      <>
                        <span>{usdSigned(p)}</span>
                        <small className="text-xs text-subtle-foreground">
                          {list.length} trade{list.length > 1 ? "s" : ""}
                        </small>
                      </>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
          <aside className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border p-4">
              <MicroLabel>
                {cal.sel ? monthDay(cal.sel) : "No day selected"}
              </MicroLabel>
              <div className={`mt-1 font-mono text-xl ${toneText((cal.sel && cal.by[cal.sel]?.reduce((x, t) => x + t.net, 0)) || 0)}`}>
                {cal.sel && cal.by[cal.sel]?.length
                  ? usdSigned(cal.by[cal.sel].reduce((x, t) => x + t.net, 0))
                  : "—"}
              </div>
            </div>
            {cal.sel && cal.by[cal.sel]?.length ? (
              <div className="flex flex-col gap-1 p-2">
                {cal.by[cal.sel].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setOpenId(t.id)}
                    className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-surface-high"
                  >
                    <TradeThumb trade={t} />
                    <span className="min-w-0 flex-1">
                      <PairCell trade={t} />
                      <span className="block text-xs text-subtle-foreground">
                        {modelLabel(t.model)} · {t.entryTime}
                      </span>
                    </span>
                    <span className={`font-mono text-sm ${toneText(t.net)}`}>
                      {usdSigned(t.net)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="m-auto px-4 py-16 text-center text-muted-foreground">
                No trades on this day.
              </div>
            )}
          </aside>
        </div>
      )}

      {openTrade && openIndex >= 0 ? (
        <TradeModal
          trade={openTrade}
          position={{ index: openIndex, total: rows.length }}
          onClose={() => setOpenId(null)}
          onStep={(d) => setOpenId(rows[openIndex + d].id)}
        />
      ) : null}
    </>
  );
}
