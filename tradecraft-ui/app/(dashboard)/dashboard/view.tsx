"use client";

import { useState } from "react";
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
import {
  monthYear,
  pnlSigned,
  pnlTone,
  usdWhole,
} from "@/lib/dashboard/format";
import { EquityChart, RadarView, SessionsChart } from "./charts";

const MODEL_BAR_COLORS = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-4",
  "bg-chart-4",
];

function ModelBars({ rows }: { rows: { name: string; count: number }[] }) {
  const max = rows[0]?.count || 1;
  return (
    <div>
      {rows.map((r, i) => (
        <div key={r.name} className="mb-4 last:mb-0">
          <div className="mb-1.5 flex justify-between text-sm">
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
  const [[y, m], setYm] = useState<[number, number]>([2026, 8]);
  const cal = getCalendarMonth(y, m);
  const tone = pnlTone(cal.total);
  const atMax = y === 2026 && m >= 8;
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
      <div className="grid grid-cols-7 gap-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            className="pb-1 text-center font-mono text-xs font-medium tracking-widest text-subtle-foreground uppercase"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cal.cells.map((c, i) =>
          c.kind === "empty" ? (
            <div key={i} />
          ) : (
            <div
              key={i}
              title={c.pnl ? pnlSigned(c.pnl) : "No trades"}
              style={{ "--k": c.intensity.toFixed(2) } as React.CSSProperties}
              className={[
                "flex min-h-15 min-w-0 flex-col items-center justify-center gap-0.5 rounded-md border border-transparent text-xs leading-4",
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
      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
        <Chip variant="profit">Green days {cal.wins}</Chip>
        <Chip variant="loss">Red days {cal.losses}</Chip>
        <Chip variant="neutral">Best day {pnlSigned(cal.best)}</Chip>
      </div>
    </Card>
  );
}

export function DashboardView() {
  const [period, setPeriod] = useState<Period>(30);
  const kpis = getKpis(period);
  const equity = getEquitySlice(period);
  const radar = getRadar(period);
  const tradeModels = getTradeModels(period);
  const entryModels = getEntryModels(period);
  const sessions = getSessions(period);
  const total = getPeriodTradeCount(period);

  return (
    <>
      <Topbar
        crumb={
          <>
            Overview / <b className="font-medium text-foreground">Dashboard</b>
          </>
        }
      />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
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

      <div className="grid grid-cols-12 gap-6 max-lg:gap-4">
        {kpis.map((k) => (
          <section
            key={k.label}
            className="col-span-12 rounded-lg border border-border bg-card p-4 sm:col-span-6 xl:col-span-3"
          >
            <MicroLabel>{k.label}</MicroLabel>
            <div
              className={[
                "mt-2 mb-3 font-mono text-3xl leading-9 font-semibold tracking-tight",
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

        <div className="col-span-12 xl:col-span-7">
          <Card>
            <CardHeader
              title="Equity curve"
              sub={
                <>
                  Account balance ·{" "}
                  <span className="font-mono">$37,480.50</span>
                </>
              }
              right={<Chip variant="neutral">{period}D</Chip>}
            />
            <EquityChart data={equity} />
          </Card>
        </div>

        <div className="col-span-12 xl:col-span-5">
          <PnLCalendar />
        </div>

        <div className="col-span-12 md:col-span-6 xl:col-span-3">
          <Card>
            <CardHeader
              title="Performance radar"
              sub="Score out of 100"
            />
            <RadarView data={radar} />
          </Card>
        </div>

        <div className="col-span-12 md:col-span-6 xl:col-span-3">
          <Card>
            <CardHeader
              title="Trade models"
              sub="Number of trades"
              right={<Chip variant="neutral">{total}</Chip>}
            />
            <ModelBars rows={tradeModels} />
          </Card>
        </div>

        <div className="col-span-12 md:col-span-6 xl:col-span-3">
          <Card>
            <CardHeader
              title="Entry models"
              sub="Number of trades"
              right={<Chip variant="neutral">{total}</Chip>}
            />
            <ModelBars rows={entryModels} />
          </Card>
        </div>

        <div className="col-span-12 md:col-span-6 xl:col-span-3">
          <Card>
            <CardHeader
              title="Active sessions"
              sub="Trades by hour · UTC"
            />
            <div className="mb-4 flex flex-wrap gap-2">
              <Chip>
                <span className="inline-block size-2 rounded-full bg-chart-2" />
                LONDON {sessions.london}
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
