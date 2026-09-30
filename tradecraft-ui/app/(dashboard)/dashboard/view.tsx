"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import {
  Card,
  CardHeader,
  Chip,
  IconButton,
  MicroLabel,
} from "@/components/dashboard/ui";
import { Icon } from "@/components/dashboard/icons";
import {
  getCalendarMonth,
  getEntryModels,
  getEquitySlice,
  getKpis,
  getPeriodTradeCount,
  getRadar,
  getSessions,
  getTradeModels,
  PERIODS,
  type Period,
} from "@/lib/dashboard/dashboard-data";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getDashboard,
  useRemoteDashboard,
  type DashboardPayload,
} from "@/lib/dashboard/remote";
import {
  monthYear,
  pnlSigned,
  pnlTone,
  usdSigned,
  usdWhole,
} from "@/lib/dashboard/format";
import { entryLabels, modelLabel } from "@/lib/dashboard/trade-record";
import { EquityChart, RadarView, SessionsChart } from "./charts";

const MODEL_BAR_COLORS = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-4",
  "bg-chart-4",
  "bg-chart-4",
];

function ModelBars({ rows }: { rows: { name: string; count: number }[] }) {
  const max = rows[0]?.count || 1;
  return (
    <div>
      {rows.map((r, i) => (
        <div key={r.name} className="mb-2.5 last:mb-0">
          <div className="mb-1 flex justify-between text-sm">
            <span>{r.name}</span>
            <b className="font-mono text-xs font-medium">{r.count}</b>
          </div>
          <span className="block h-1 rounded-full bg-accent">
            <u
              className={`block h-full rounded-full ${MODEL_BAR_COLORS[i] ?? "bg-chart-4"}`}
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

function PnLCalendar() {
  const { status } = useAuth();
  const [[y, m], setYm] = useState<[number, number]>([2026, 8]);
  // Remote month calendar when authed (null = keep the seeded fallback).
  const [remoteCal, setRemoteCal] = useState<DashboardPayload["calendar"] | null>(
    null,
  );
  useEffect(() => {
    if (status !== "authed") return;
    let cancelled = false;
    const key = `${y}-${String(m + 1).padStart(2, "0")}`;
    getDashboard({ period: 30, month: key })
      .then((d) => {
        if (!cancelled) setRemoteCal(d.calendar);
      })
      .catch(() => {
        if (!cancelled) setRemoteCal(null);
      });
    return () => {
      cancelled = true;
    };
  }, [status, y, m]);
  const seed = getCalendarMonth(y, m);
  const key = `${y}-${String(m + 1).padStart(2, "0")}`;
  // Build the seeded-style grid, overlaying remote day P&Ls when available.
  const cal = (() => {
    if (status !== "authed" || !remoteCal || remoteCal.month !== key) return seed;
    const byPnl = new Map(remoteCal.days.map((d) => [d.date, d.pnl]));
    const cells = seed.cells.map((c) => {
      if (c.kind !== "day") return c;
      const iso = `${key}-${String(c.day).padStart(2, "0")}`;
      if (!byPnl.has(iso)) return { ...c, pnl: 0 };
      const pnl = byPnl.get(iso) ?? 0;
      return { ...c, pnl, intensity: Math.min(Math.abs(pnl) / 800, 1) };
    });
    return {
      ...seed,
      cells,
      total: remoteCal.total,
      wins: remoteCal.wins,
      losses: remoteCal.losses,
      best: remoteCal.best,
    };
  })();
  const tone = pnlTone(cal.total);
  const atMax = status === "authed" ? false : y === 2026 && m >= 8;
  return (
    <Card>
      <CardHeader
        title="P&L calendar"
        sub={
          <>
            Net{" "}
            <span
              className={
                tone === "profit"
                  ? "font-mono text-profit"
                  : tone === "loss"
                    ? "font-mono text-loss"
                    : "font-mono"
              }
            >
              {usdWhole(cal.total)}
            </span>
          </>
        }
        right={
          <div className="flex items-center gap-1">
            <IconButton
              label="Previous month"
              onClick={() =>
                setYm(([yy, mm]) => (mm ? [yy, mm - 1] : [yy - 1, 11]))
              }
            >
              <Icon name="l" />
            </IconButton>
            <span className="min-w-16 text-center font-mono text-xs text-muted-foreground">
              {monthYear(y, m)}
            </span>
            <IconButton
              label="Next month"
              disabled={atMax}
              onClick={() =>
                setYm(([yy, mm]) => (mm < 11 ? [yy, mm + 1] : [yy + 1, 0]))
              }
            >
              <Icon name="r" />
            </IconButton>
          </div>
        }
      />
      <div className="grid grid-cols-7 gap-1.5">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            className="pb-1 text-center font-mono text-xs font-medium tracking-widest text-subtle-foreground uppercase"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cal.cells.map((c, i) =>
          c.kind === "empty" ? (
            <div key={i} />
          ) : (
            <div
              key={i}
              title={c.pnl ? pnlSigned(c.pnl) : "No trades"}
              style={{ "--k": c.intensity.toFixed(2) } as React.CSSProperties}
              className={[
                "flex min-h-10 min-w-0 flex-col items-center justify-center gap-px rounded-md border border-transparent text-[11px] leading-4 md:min-h-11",
                c.pnl > 0
                  ? "cal-day-win"
                  : c.pnl < 0
                    ? "cal-day-loss"
                    : "text-subtle-foreground",
                c.today ? "outline-1 outline-primary outline-offset-2" : "",
              ].join(" ")}
            >
              <b
                className={`text-sm leading-4 font-medium ${c.pnl ? "text-foreground" : "text-subtle-foreground"}`}
              >
                {c.day}
              </b>
              {c.pnl ? <span>{pnlSigned(c.pnl)}</span> : null}
            </div>
          ),
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
        <Chip variant="profit">Green days {cal.wins}</Chip>
        <Chip variant="loss">Red days {cal.losses}</Chip>
        <Chip variant="neutral">Best day {pnlSigned(cal.best)}</Chip>
      </div>
    </Card>
  );
}

export function DashboardView() {
  const [period, setPeriod] = useState<Period>(30);
  // Remote aggregates when authed; seeded getters stay as fallback.
  const remote = useRemoteDashboard(period);
  const kpis = remote?.kpis ?? getKpis(period);
  const equity = remote?.equity ?? getEquitySlice(period);
  const radar = remote?.radar ?? getRadar(period);
  const tradeModels = (remote?.tradeModels ?? getTradeModels(period)).map((r) => ({
    ...r,
    name: remote ? modelLabel(r.name) || r.name : r.name,
  }));
  const entryModels = (remote?.entryModels ?? getEntryModels(period)).map((r) => ({
    ...r,
    name: remote ? entryLabels([r.name])[0] || r.name : r.name,
  }));
  const sessions = remote?.sessions ?? getSessions(period);
  const total = remote?.tradeCount ?? getPeriodTradeCount(period);
  const lastEquity = equity.length ? equity[equity.length - 1].value : 0;

  return (
    <>
      <Topbar
        crumb={
          <>
            Overview / <b className="font-medium text-foreground">Dashboard</b>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl leading-8 font-medium tracking-tight">
            Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Your trading performance through Sep 29, 2026.
          </p>
        </div>
        <div
          role="group"
          aria-label="Period"
          className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 [scrollbar-width:none]"
        >
          {PERIODS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPeriod(n)}
              className={[
                "flex h-7 items-center gap-1.5 rounded-full px-3 font-mono text-sm font-medium whitespace-nowrap transition-colors",
                n === period
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {n}D
            </button>
          ))}
          <button
            type="button"
            title="Custom range (coming soon)"
            className="flex h-7 items-center gap-1.5 rounded-full px-3 font-mono text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
          >
            <Icon name="cal" />
            Customize
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 max-lg:gap-3">
        {kpis.map((k) => (
          <section
            key={k.label}
            className="col-span-12 min-w-0 rounded-lg border border-border bg-card p-3.5 sm:col-span-6 xl:col-span-3"
          >
            <MicroLabel>{k.label}</MicroLabel>
            <div
              className={[
                "mt-1.5 mb-2 font-mono text-3xl leading-8 font-semibold tracking-tight",
                k.tone === "profit"
                  ? "text-profit"
                  : k.tone === "loss"
                    ? "text-loss"
                    : "",
              ].join(" ")}
            >
              {k.value}
            </div>
            <div className="flex items-center gap-2">
              <Chip variant="profit">{k.delta}</Chip>
              <span className="mt-0.5 text-xs leading-4 text-muted-foreground">
                {k.vs}
              </span>
            </div>
          </section>
        ))}

        <div className="col-span-12 min-w-0 xl:col-span-7">
          <Card>
            <CardHeader
              title="Equity curve"
              sub={
                remote ? (
                  <>
                    Cumulative net ·{" "}
                    <span className="font-mono">{usdSigned(lastEquity)}</span>
                  </>
                ) : (
                  <>
                    Account balance ·{" "}
                    <span className="font-mono">$37,480.50</span>
                  </>
                )
              }
              right={<Chip variant="neutral">{period}D</Chip>}
            />
            <EquityChart data={equity} />
          </Card>
        </div>

        <div className="col-span-12 min-w-0 xl:col-span-5">
          <PnLCalendar />
        </div>

        <div className="col-span-12 min-w-0 md:col-span-6 xl:col-span-3">
          <Card>
            <CardHeader
              title="Performance radar"
              sub="Score out of 100"
            />
            <RadarView data={radar} />
          </Card>
        </div>

        <div className="col-span-12 min-w-0 md:col-span-6 xl:col-span-3">
          <Card>
            <CardHeader
              title="Trade models"
              sub="Number of trades"
              right={<Chip variant="neutral">{total}</Chip>}
            />
            <ModelBars rows={tradeModels} />
          </Card>
        </div>

        <div className="col-span-12 min-w-0 md:col-span-6 xl:col-span-3">
          <Card>
            <CardHeader
              title="Entry models"
              sub="Number of trades"
              right={<Chip variant="neutral">{total}</Chip>}
            />
            <ModelBars rows={entryModels} />
          </Card>
        </div>

        <div className="col-span-12 min-w-0 md:col-span-6 xl:col-span-3">
          <Card>
            <CardHeader
              title="Active sessions"
              sub="Trades by hour · UTC"
            />
            <div className="mb-2.5 flex flex-wrap gap-2">
              <Chip>
                <span className="inline-block size-2 rounded-full bg-chart-2" />
                LONDON {sessions.london}
              </Chip>
              <Chip>
                <span className="inline-block size-2 rounded-full bg-chart-3" />
                FRANKFURT {sessions.frankfurt}
              </Chip>
              <Chip>
                <span className="inline-block size-2 rounded-full bg-chart-1" />
                NEW YORK {sessions.newyork}
              </Chip>
            </div>
            <SessionsChart hours={sessions.hours} />
          </Card>
        </div>
      </div>
    </>
  );
}
